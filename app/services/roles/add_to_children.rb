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
      add_roles_to_children
    end

    private

    def add_roles_to_children
      children.all? do |child|
        if @inheritance.inherit_from_parent?(child, add_user_ids: all_user_ids, role_name: @role_name)
          save_new_child_roles(child)
          recursively_add_roles_to_grandchildren(child)
        else
          true
        end
      end
    end

    def recursively_add_roles_to_grandchildren(child)
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

    def all_user_ids
      (@users_to_add.map(&:id) + @groups_to_add.map(&:user_ids)).flatten.uniq
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
