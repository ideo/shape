module Roles
  class AddToChildren
    def initialize(role_name:, parent:, users_to_add: [], groups_to_add: [])
      @users_to_add = users_to_add
      @groups_to_add = groups_to_add
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
            role_name: @role_name,
            parent: child,
            users_to_add: @users_to_add,
            groups_to_add: @groups_to_add,
          ).call
        else
          true
        end
      end
    end

    def new_role_identifiers
      user_role_identifiers + group_role_identifiers
    end

    def user_role_identifiers
      @users_to_add.map do |user|
        Role.identifier(role_name: @role_name, user_id: user.id)
      end
    end

    def group_role_identifiers
      @groups_to_add.map do |group|
        Role.identifier(role_name: @role_name, group_id: group.id)
      end
    end

    def save_new_child_roles(child)
      Roles::MassAssign.new(
        object: child,
        role_name: @role_name,
        users: @users_to_add,
        groups: @groups_to_add,
        propagate_to_children: false,
      ).call
    end

    def children
      return [] unless @parent.respond_to?(:children)

      @parent.children
    end
  end
end
