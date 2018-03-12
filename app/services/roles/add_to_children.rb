module Roles
  class AddToChildren
    def initialize(object:, roles:)
      @object = object
      @roles = roles
    end

    def call
      return false unless add_roles_to_children
      recursively_add_roles
    end

    private

    attr_reader :object, :roles

    def add_roles_to_children
      roles.all? do |role|
        children.all? do |child|
          child_role = copy_role_to_object(role, child)
          child_role.persisted?
        end
      end
    end

    def recursively_add_roles
      children.all? do |child|
        Roles::AddToChildren.new(
          object: child,
          roles: roles,
        ).call
      end
    end

    def copy_role_to_object(role, object)
      # Use amoeba_dup so it copies all associated users_roles
      new_role = role.amoeba_dup
      new_role.resource = object
      new_role.save
      new_role
    end

    def children
      return [] unless object.respond_to?(:children)

      object.children
    end
  end
end
