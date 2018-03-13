module Roles
  class AddToChildren
    def initialize(parent:, roles:)
      @parent = parent
      @roles = roles
      @inheritance = Roles::Inheritance.new(parent)
    end

    def call
      return false unless add_roles_to_children
      recursively_add_roles
    end

    private

    attr_reader :parent, :roles, :inheritance

    def add_roles_to_children
      children.all? do |child|
        # Build copy of role and add users to test if we should copy it
        child_roles = build_child_roles(child)
        next unless inheritance.inherit_from_parent?(child, child_roles)
        # Save all new children roles
        child_roles.all?(&:save)
      end
    end

    def recursively_add_roles
      children.all? do |child|
        Roles::AddToChildren.new(
          parent: child,
          roles: roles,
        ).call
      end
    end

    def build_child_roles(child)
      roles.map do |role|
        role.build_copy(child)
      end
    end

    def children
      return [] unless parent.respond_to?(:children)

      parent.children
    end
  end
end
