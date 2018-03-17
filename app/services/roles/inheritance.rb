module Roles
  class Inheritance
    def initialize(parent)
      @parent_roles = role_user_identifiers(parent.roles)
    end

    def inherit_from_parent?(child, new_role_or_roles = nil)
      roles = child_role_identifiers(child, new_role_or_roles)
      should_inherit?(roles)
    end

    private

    attr_reader :parent_roles

    # Tests to see if children permissions are same or more permissive than parent
    # If so, apply roles. If not, ignore this object.
    def should_inherit?(child_roles)
      # Yes if they have the same roles
      return true if parent_roles == child_roles

      # No if parent has more roles than child
      return false if (parent_roles - child_roles).size.positive?

      # Yes if child has more roles than parent,
      #   but all of parents' roles are included in the child
      intersection = parent_roles & child_roles
      return true if (parent_roles - intersection).size.zero?

      # Otherwise No
      false
    end

    def child_role_identifiers(child, new_role_or_roles)
      new_roles = *new_role_or_roles
      role_user_identifiers(child.roles + new_roles)
    end

    # Pass in roles to exclude in the scenario that you're adding them to children,
    # and the parent will already have them -- so if you compare inheritance,
    # the parent wouldn't have the same roles as children
    def role_user_identifiers(roles)
      roles.map do |role|
        user_ids = role.users_roles.map(&:user_id) if role.new_record?
        user_ids = role.user_ids if role.persisted?
        user_ids.map do |user_id|
          "#{role.name}_User_#{user_id}"
        end
      end.flatten.compact
    end
  end
end
