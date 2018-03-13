module Roles
  class Inheritance
    def initialize(object)
      @object = object
      @object_roles_and_users = all_roles_and_users(object)
    end

    def child_should_inherit?(child)
      should_inherit?(child)
    end

    private

    attr_reader :object, :object_roles_and_users

    # Tests to see if children permissions are same or more permissive than parent
    # If so, apply roles. If not, ignore this object.
    def should_inherit?(child)
      child_roles_and_users = all_roles_and_users(child)

      # Yes if they have the same roles
      return true if object_roles_and_users == child_roles_and_users

      # No if parent has more roles than child
      return false if (object_roles_and_users - child_roles_and_users).size.positive?

      # Yes if child has more roles than parent,
      #   but all of parents' roles are included in the child
      intersection = object_roles_and_users & child_roles_and_users
      return true if (object_roles_and_users - intersection.size).zero?

      # Otherwise No
      false
    end

    def all_roles_and_users(object)
      object.roles.map do |role|
        role.user_ids.map do |user_id|
          "#{role.identifier}_User_#{user_id}"
        end
      end.compact
    end
  end
end
