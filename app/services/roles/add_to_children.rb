module Roles
  class AddToChildren
    def initialize(object:, role:)
      @object = object
      @role = role
    end

    def call
      apply_role_to_children
    end

    private

    attr_reader :object, :role

    def apply_role_to_children
      object.children.all? do |child|
        # Apply the role to this object
        add_to_child = Roles::AddToChild.new(
          object: child,
          parent_role: role,
        )

        return false unless add_to_child.call

        # Apply the role recursively to this object's children
        Roles::AddToChildren.new(
          object: child,
          role: add_to_child.role,
        ).call
      end
    end

    def children
      return [] unless object.respond_to?(:children)

      object.children
    end
  end
end
