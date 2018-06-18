module Roles
  class MassRemove
    include Roles::SharedMethods

    attr_reader :errors

    def initialize(object:,
                   role_name:,
                   users: [],
                   groups: [],
                   remove_from_children_sync: false,
                   remove_link: false)
      @object = object
      @role_name = role_name
      @remove_from_children_sync = remove_from_children_sync
      @remove_link = remove_link
      @users = users
      @groups = groups
      @errors = []
    end

    def call
      remove_role_from_object(@object)
      unfollow_comment_thread
      unfollow_groups_comment_threads
      remove_links_from_shared_collections if @remove_link
      remove_org_membership if @remove_link
      remove_roles_from_children
    end

    private

    def remove_links_from_shared_collections
      UnlinkFromSharedCollectionsWorker.perform_async(
        shared_user_ids,
        group_ids,
        collections_to_link,
        items_to_link,
      )
    end

    # Removes roles synchronously from children,
    # and asynchronously from grandchildren
    def remove_roles_from_children
      if @remove_from_children_sync
        children.all? do |child|
          remove_role_from_object(child) &&
            remove_roles_from_grandchildren(child)
        end
      else
        MassRemoveRolesWorker.perform_async(
          @object.id,
          @object.class.name,
          @role_name,
          @users.map(&:id),
          @groups.map(&:id),
        )
        true
      end
    end

    def remove_roles_from_grandchildren(child)
      return true unless child.respond_to?(:children)
      child.children.each do |grandchild|
        MassRemoveRolesWorker.perform_async(
          grandchild.id,
          grandchild.class.name,
          @role_name,
          @users.map(&:id),
          @groups.map(&:id),
        )
      end
      true
    end

    def remove_role_from_object(object)
      role = object.roles.find_by(name: @role_name)
      return true unless role.present?

      remove_users_from_role(role) &&
        remove_groups_from_role(role)
    end

    def remove_users_from_role(role)
      existing_user_ids = role.users.pluck(:id).to_a

      @users.each do |user|
        if existing_user_ids.include?(user.id)
          user.remove_role(role.name, role.resource)
        end
      end

      true
    end

    def remove_groups_from_role(role)
      existing_group_ids = role.groups.pluck(:id).to_a

      @groups.each do |group|
        if existing_group_ids.include?(group.id)
          role.groups.destroy(group)
        end
      end

      true
    end

    def remove_org_membership
      return unless @object.is_a?(Group) && (@object.guest? || @object.primary?)
      @users.each do |user|
        @object.organization.remove_user_membership(user)
      end
    end

    def children
      return [] unless @object.respond_to?(:children)

      @object.children
    end

    def unfollow_comment_thread
      return unless @object.is_a?(Item) || @object.is_a?(Collection)
      return unless @object.comment_thread.present?
      RemoveCommentThreadFollowers.perform_async(
        @object.comment_thread.id,
        @users.map(&:id),
        @groups.map(&:id),
      )
    end

    def unfollow_groups_comment_threads
      return unless @object.is_a?(Group)
      thread_ids = @object.groups_threads.pluck(:comment_thread_id)
      return if thread_ids.empty?
      RemoveCommentThreadFollowers.perform_async(
        thread_ids,
        @users.map(&:id),
      )
    end
  end
end
