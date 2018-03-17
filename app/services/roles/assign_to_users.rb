module Roles
  class AssignToUsers
    attr_reader :roles, :errors, :failed_users

    def initialize(object:, role_name:, users: [])
      @object = object
      @role_name = role_name
      @users = users
      @roles = []
      @errors = []
      @failed_users = []
    end

    def call
      return false unless valid_object_and_role_name?
      assign_role_to_users
      failed_users.blank?
    end

    private

    attr_reader :object, :role_name, :users

    def assign_role_to_users
      users.each do |user|
        role = user.add_role(role_name, object)
        if role.persisted?
          roles << role
        else
          failed_users << user
        end
      end
      roles.uniq!
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
