module Roles
  class Inheritance
    def initialize(parent)
      @parent_roles = role_user_identifiers(parent.roles)
    end

    def inherit_from_parent?(child, new_user_role_identifiers = [])
      # Yes if there are no child roles yet
      return true if child.roles.empty?

      proposed_roles = proposed_new_role_identifiers(child, new_user_role_identifiers)
      should_inherit?(proposed_roles)
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

    def proposed_new_role_identifiers(child, new_user_role_identifiers)
      (role_user_identifiers(child.roles) + new_user_role_identifiers).uniq
    end

    # Pass in roles to exclude in the scenario that you're adding them to children,
    # and the parent will already have them -- so if you compare inheritance,
    # the parent wouldn't have the same roles as children
    def role_user_identifiers(roles)
      roles.map do |role|
        user_ids = role.users_roles.map(&:user_id) if role.new_record?
        user_ids = role.user_ids if role.persisted?
        user_ids.map do |user_id|
          UsersRole.identifier(role_name: role.name, user_id: user_id)
        end
      end.flatten.compact.uniq
    end
  end
end
