module Roles
  class InheritFromParent
    # New object added - inherit from parent
    # New role added - apply to children
    # New role removed - apply to children
    def initialize(object)
      @object = object
    end

    def call
      return false if parent_roles.blank?

      apply_parent_roles_to_object
    end

    private

    # Copies roles from parent,
    # returns true if all were successfully saved
    def apply_parent_roles_to_object
      parent_roles.all? do |role|
        Roles::AddToChild.new(
          object: object,
          parent_role: role,
        ).call
      end
    end

    def parent_roles
      object.parent.try(:roles)
    end
  end
end
