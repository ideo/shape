module Roles
  class MassRemove
    attr_reader :errors

    def initialize(object:, role_name:, users: [], groups: [], remove_from_children_sync: false)
      @object = object
      @role_name = role_name
      @remove_from_children_sync = remove_from_children_sync
      @users = users
      @groups = groups
      @errors = []
    end

    def call
      remove_role_from_object(@object)
      remove_links_from_user_collections
      remove_roles_from_children
    end

    private

    def remove_links_from_user_collections
      group_users = @groups.reduce([]) {
        |accg, group| accg + group.roles.reduce([]) {
          |accr, role| accr + role.users } }
      UnlinkFromSharedCollectionsWorker.perform_async(
        (group_users + @users).uniq.map(&:id),
        @object.id,
        @object.class.name.to_s,
      )
    end

    # Removes roles synchronously from children,
    # and asynchronously from grandchildren
    def remove_roles_from_children
      if @remove_from_children_sync
        children.all? do |child|
          remove_role_from_object(child) &&
            remove_roles_from_grandchildren
        end
      else
        MassRemoveRolesWorker.perform_async(
          @object.id,
          @object.class.name.to_s,
          @role_name,
          @users.map(&:id),
          @groups.map(&:id),
        )
        true
      end
    end

    def remove_roles_from_grandchildren
      children.each do |child|
        MassRemoveRolesWorker.perform_async(
          child.id,
          child.class.name.to_s,
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
          role.users.delete(user)
        end
      end

      true
    end

    def remove_groups_from_role(role)
      existing_group_ids = role.groups.pluck(:id).to_a

      @groups.each do |group|
        if existing_group_ids.include?(group.id)
          role.groups.delete(group)
        end
      end

      true
    end

    def children
      return [] unless @object.respond_to?(:children)

      @object.children
    end
  end
end
