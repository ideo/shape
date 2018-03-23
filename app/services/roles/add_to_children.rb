module Roles
  class AddToChildren
    def initialize(users_and_groups_to_add:, role_name:, parent:)
      @users_and_groups_to_add = users_and_groups_to_add
      @parent = parent
      @role_name = role_name
      @inheritance = Roles::Inheritance.new(parent)
    end

    def call
      return false unless add_roles_to_children
      recursively_add_roles_to_grandchildren
    end

    private

    def add_roles_to_children
      children.all? do |child|
        if @inheritance.inherit_from_parent?(child, new_role_identifiers)
          save_new_child_roles(child)
        else
          true
        end
      end
    end

    def recursively_add_roles_to_grandchildren
      children.all? do |child|
        if child.respond_to?(:children) &&
           child.children.present?
          Roles::AddToChildren.new(
            users_and_groups_to_add: @users_and_groups_to_add,
            role_name: @role_name,
            parent: child,
          ).call
        else
          true
        end
      end
    end

    def new_role_identifiers
      @users_and_groups_to_add.map do |user_or_group|
        if user_or_group.is_a?(User)
          UsersRole.identifier(role_name: @role_name, user_id: user_or_group.id)
        elsif user_or_group.is_a?(Group)
          GroupsRole.identifier(role_name: @role_name, group_id: user_or_group.id)
        end
      end
    end

    def save_new_child_roles(child)
      Roles::AssignToUsers.new(
        object: child,
        role_name: @role_name,
        users: @users_to_add,
        propagate_to_children: false,
      ).call
    end

    def children
      return [] unless @parent.respond_to?(:children)

      @parent.children
    end
  end
end
