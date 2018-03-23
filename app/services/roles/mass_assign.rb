module Roles
  class MassAssign
    attr_reader :errors, :failed, :added

    def initialize(object:, role_name:, users: [], groups: [], propagate_to_children: false)
      @object = object
      @role_name = role_name
      @users = users
      @groups = groups
      @propagate_to_children = propagate_to_children
      @added = []
      @failed = []
      @roles = []
    end

    def call
      return false unless valid_object_and_role_name?
      assign_role_to_users_and_groups
      add_roles_to_children_async if @propagate_to_children
      failed_users.blank? && failed_groups.blank?
    end

    private

    def assign_role_to_users_and_groups
      (@users + @groups).each do |user_or_group|
        role = user_or_group.add_role(@role_name, @object)
        if role.persisted?
          @added << user_or_group
        else
          @failed << user_or_group
        end
      end
    end

    def add_roles_to_children_async
      AddRolesToChildrenWorker.perform_async(
        @users.map(&:id),
        @groups.map(&:id),
        @role_name,
        @object.id,
        @object.class.name.to_s,
      )
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
