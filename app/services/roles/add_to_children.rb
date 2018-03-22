module Roles
  class AddToChildren
    def initialize(users_to_add:, role_name:, parent:)
      @users_to_add = users_to_add
      @parent = parent
      @role_name = role_name
      @inheritance = Roles::Inheritance.new(parent)
    end

    def call
      return false unless add_roles_to_children
      recursively_add_roles_to_grandchildren
    end

    private

    attr_reader :users_to_add, :role_name, :parent, :inheritance

    def add_roles_to_children
      children.all? do |child|
        next unless inheritance.inherit_from_parent?(child, new_user_role_identifiers)
        # Save all new children roles
        save_new_child_roles(child)
      end
    end

    def recursively_add_roles_to_grandchildren
      children.all? do |child|
        Roles::AddToChildren.new(
          users_to_add: @users_to_add,
          role_name: @role_name,
          parent: child,
        ).call
      end
    end

    def new_user_role_identifiers
      @users_to_add.map do |user|
        UsersRole.identifier(role_name: @role_name, user_id: user.id)
      end
    end

    def save_new_child_roles(child)
      assigner = Roles::AssignToUsers.new(
        object: child,
        role_name: @role_name,
        users: @users_to_add,
        propagate: false,
      )
      assigner.call
    end

    def children
      return [] unless parent.respond_to?(:children)

      parent.children
    end
  end
end
