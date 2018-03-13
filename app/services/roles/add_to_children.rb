module Roles
  class AddToChildren

    # Use ignore_inheritance_rules when first setting up object inheritance,
    # as the object will have a single user assigned as the editor

    def initialize(object:, roles:, ignore_inheritance_rules: false)
      @object = object
      @roles = roles
      @ignore_inheritance_rules = ignore_inheritance_rules
      @inheritance = Roles::Inheritance.new(object)
    end

    def call
      return false unless add_roles_to_children
      recursively_add_roles
    end

    private

    attr_reader :object, :roles, :inheritance,
                :ignore_inheritance_rules

    def add_roles_to_children
      children.all? do |child|
        # TODO: how do we know this is the first time through, to ignore this?
        unless ignore_inheritance_rules
          next if inheritance.child_should_inherit?(child)
        end

        roles.all? do |role|
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
