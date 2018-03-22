module Roles
  class AddToChildren
    def initialize(parent:, new_roles:)
      @parent = parent
      @new_roles = new_roles
      @inheritance = Roles::Inheritance.new(parent)
    end

    def call
      return false unless add_roles_to_children
      recursively_add_roles
    end

    private

    attr_reader :parent, :new_roles, :inheritance

    def add_roles_to_children
      children.all? do |child|
        # Build copy of role and add users to test if we should copy it
        new_child_roles = copy_new_roles_onto_child(child)
        next unless inheritance.inherit_from_parent?(child, new_child_roles)
        # Save all new children roles
        new_child_roles.all?(&:save)
      end
    end

    def recursively_add_roles
      children.all? do |child|
        Roles::AddToChildren.new(
          parent: child,
          new_roles: new_roles,
        ).call
      end
    end

    def copy_new_roles_onto_child(child)
      new_roles.map do |role|
        role.duplicate!(assign_resource: child, dont_save: true)
      end
    end

    def children
      return [] unless parent.respond_to?(:children)

      parent.children
    end
  end
end
