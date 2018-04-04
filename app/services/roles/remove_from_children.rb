module Roles
  class RemoveFromChildren
    def initialize(parent:, role_name:, users: [], groups: [])
      @parent = parent
      @role_name = role_name
      @users = users
      @groups = groups
    end

    def call
      return false unless remove_roles_from_children
      remove_roles_from_grandchildren
    end

    private

    def remove_roles_from_children
      children.all? do |child|
        remove_role_from_object(child)
      end
    end

    def remove_roles_from_grandchildren
      children.all? do |child|
        Roles::RemoveFromChildren.new(
          parent: child,
          role_name: @role_name,
          users: @users,
          groups: @groups,
        ).call
      end
    end

    def remove_role_from_object(object)
      role = object.roles.find_by(name: @role_name)
      return true unless role.present?

      remove_users_from_role(role) &&
        remove_groups_from_role(role)
    end

    def remove_users_from_role(role)
      existing_user_ids = role.users.pluck(:id)

      @users.each do |user|
        if existing_user_ids.include?(user.id)
          role.users.delete(user)
        end
      end

      true
    end

    def remove_groups_from_role(role)
      existing_group_ids = role.groups.pluck(:id)

      @groups.each do |group|
        if existing_group_ids.include?(group.id)
          role.users.delete(group)
        end
      end

      true
    end

    def children
      return [] unless @parent.respond_to?(:children)

      @parent.children
    end
  end
end
