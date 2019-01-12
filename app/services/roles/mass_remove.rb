module Roles
  class MassRemove
    include Roles::SharedMethods

    attr_reader :errors

    def initialize(object:,
                   role_name:,
                   users: [],
                   groups: [],
                   propagate_to_children: false,
                   removed_by: nil,
                   fully_remove: false)
      @object = object
      @role_name = role_name
      @removed_by = removed_by
      @fully_remove = fully_remove
      @users = users
      @groups = groups
      @errors = []
      @previous_anchor_id = nil
      @propagate_to_children = propagate_to_children
    end

    def call
      unanchor_object # from shared methods
      remove_role_from_object(@object)
      unfollow_comment_thread
      unfollow_groups_comment_threads
      remove_links_from_shared_collections if @fully_remove
      remove_org_membership_if_necessary if @fully_remove
      remove_roles_from_children if @propagate_to_children
      true
    end

    private

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

    def unfollow_comment_thread
      return unless @object.item_or_collection?
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

    def remove_links_from_shared_collections
      UnlinkFromSharedCollectionsWorker.perform_async(
        shared_user_ids,
        group_ids,
        collections_to_link,
        items_to_link,
      )
    end

    def remove_org_membership_if_necessary
      return unless @object.is_a?(Group) && (@object.guest? || @object.primary?)
      @users.each do |user|
        # if someone is in both primary + guest for whatever reason, removing them
        # from one shouldn't kick them out of the whole org
        next if @object.organization.primary_group.can_view?(user) ||
                @object.organization.guest_group.can_view?(user)
        @object.organization.remove_user_membership(user)
      end
    end

    def children
      return [] unless @object.respond_to?(:children)

      @object.children
    end

    def remove_roles_from_children
      ModifyChildrenRolesWorker.perform_async(
        @removed_by.id,
        @users.map(&:id),
        @groups.map(&:id),
        @role_name,
        @object.id,
        @object.class.name,
        @previous_anchor_id,
        'remove',
      )
    end
  end
end
