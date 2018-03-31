module Roles
  class Inheritance
    def initialize(parent)
      @parent_roles = role_identifiers(parent.roles)
    end

    def inherit_from_parent?(child, new_role_identifiers = [])
      # Yes if there are no child roles yet
      return true if child.roles.empty?

      proposed_roles = proposed_role_identifiers(child, new_role_identifiers)
      should_inherit?(proposed_roles)
    end

    # if inherit is false, then the child is "private"
    def private_child?(child)
      !inherit_from_parent?(child)
    end

    private

    attr_reader :parent_roles

    # Tests to see if children permissions are same or more permissive than parent
    # If so, apply roles. If not, ignore this object.
    def should_inherit?(proposed_roles)
      # Yes if they have the same roles
      return true if @parent_roles == proposed_roles

      # No if parent has more roles than child
      return false if (@parent_roles - proposed_roles).size.positive?

      # Yes if child has more roles than parent,
      #   but all of parents' roles are included in the child
      intersection = @parent_roles & proposed_roles
      return true if (@parent_roles - intersection).size.zero?

      # Otherwise No
      false
    end

    def proposed_role_identifiers(child, new_role_identifiers)
      (role_identifiers(child.roles) + new_role_identifiers).uniq
    end

    # Pass in roles to exclude in the scenario that you're adding them to children,
    # and the parent will already have them -- so if you compare inheritance,
    # the parent wouldn't have the same roles as children
    def role_identifiers(roles)
      roles.map do |role|
        (role.user_identifiers + role.group_identifiers)
      end.flatten.compact.uniq
    end
  end
end
