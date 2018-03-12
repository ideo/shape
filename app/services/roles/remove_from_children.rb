module Roles
  class RemoveFromChildren
    def initialize(object:, roles:)
      @object = object
      @roles = roles
    end

    def call
      return false unless remove_roles_from_children
      recursively_remove_roles
    end

    private

    attr_reader :object, :roles

    def remove_roles_from_children
      roles.all? do |role|
        children.all? do |child|
          remove_role_from_object(child, role.name)
        end
      end
    end

    def recursively_remove_roles
      children.all? do |child|
        Roles::RemoveFromChildren.new(
          object: child,
          roles: roles,
        ).call
      end
    end

    def remove_role_from_object(object, role_name)
      object_role = object.roles.find_by(name: role_name)
      return false unless object_role.present?
      object_role.destroy_without_children_callbacks
    end

    def children
      return [] unless object.respond_to?(:children)

      object.children
    end
  end
end
