module Roles
  class AssignToUsers
    attr_reader :errors, :failed_users, :added_users

    def initialize(object:, role_name:, users: [], propagate_to_children: false, synchronous: false)
      @object = object
      @role_name = role_name
      @users = users
      @propagate_to_children = propagate_to_children
      @synchronous = synchronous
      @added_users = []
      @errors = []
      @failed_users = []
    end

    def call
      return false unless valid_object_and_role_name?
      assign_role_to_users
      add_roles_to_children if @propagate_to_children
      failed_users.blank?
    end

    private

    def assign_role_to_users
      @users.each do |user|
        role = user.add_role(@role_name, @object)
        if role.persisted?
          @added_users << user
        else
          @failed_users << user
        end
      end
    end

    def add_roles_to_children
      return unless @object.respond_to?(:children)
      return unless @object.children.any?
      if @synchronous
        AddRolesToChildrenWorker.new.perform(
          @added_users.map(&:id),
          @role_name,
          @object.id,
          @object.class.name.to_s,
        )
      else
        AddRolesToChildrenWorker.perform_async(
          @added_users.map(&:id),
          @role_name,
          @object.id,
          @object.class.name.to_s,
        )
      end
    end

    def valid_object_and_role_name?
      unless @object.is_a?(Resourceable)
        @errors << "You can't assign roles to that object"
        return false
      end

      unless @object.class.resourceable_roles.include?(@role_name.to_sym)
        @errors << "#{@role_name} is not a valid role on #{@object.class.name}"
        return false
      end

      true
    end
  end
end
