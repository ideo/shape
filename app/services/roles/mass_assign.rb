module Roles
  class MassAssign
    attr_reader :roles, :errors, :failed

    def initialize(object:, role_name:, users: [], groups: [])
      @object = object
      @role_name = role_name
      @users = users
      @groups = groups
      @roles = []
      @errors = []
      @failed = []
    end

    def call
      return false unless valid_object_and_role_name?
      assign_role_to_users_and_groups
      add_roles_to_children_async
      failed_users.blank?
    end

    private

    attr_reader :object, :role_name, :users, :groups

    def assign_role_to_users_and_groups
      (users + groups).each do |user_or_group|
        role = user_or_group.add_role(role_name, object)
        if role.persisted?
          roles << role
        else
          failed << object
        end
      end
      roles.uniq!
    end

    def add_roles_to_children_async
      AddRolesToChildrenWorker.perform_async(
        roles.map(&:id),
        object.id,
        object.class.name.to_s,
      )
    end

    def valid_object_and_role_name?
      unless object.is_a?(Resourceable)
        @errors << "You can't assign roles to that object"
        return false
      end

      unless object.class.resourceable_roles.include?(role_name.to_sym)
        @errors << "#{role_name} is not a valid role on #{object.class.name}"
        return false
      end

      true
    end
  end
end
