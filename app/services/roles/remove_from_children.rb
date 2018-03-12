module Roles
  class RemoveFromChildren
    def initialize(object:, role:)
      @object = object
      @role = role
    end

    def call
      remove_role_from_children
    end

    private

    def remove_role_from_children
      object.children.all? do |object|
        return false unless object.roles.delete(role)

        # Remove the role recursively from this object's children
        Roles::RemoveFromChildren.new(
          object: object,
          role: role,
        ).call
      end
    end

    def children
      return [] unless object.respond_to?(:children)

      object.children
    end
  end
end
