module Roles
  class MassAssign
    attr_reader :errors, :added_users, :added_groups,
                :failed_users, :failed_groups

    def initialize(object:,
                   role_name:,
                   users: [],
                   groups: [],
                   propagate_to_children: false,
                   synchronous: false,
                   invited_by: nil,
                   create_link: false)
      @object = object
      @role_name = role_name
      @users = users
      @groups = groups
      @propagate_to_children = propagate_to_children
      @synchronous = synchronous
      @invited_by = invited_by
      @create_link = create_link
      @added_users = []
      @added_groups = []
      @failed_users = []
      @failed_groups = []
      @roles = []
      @errors = []
    end

    def call
      return false unless valid_object_and_role_name?
      assign_role_to_users
      notify_users if @invited_by
      assign_role_to_groups
      link_to_shared_collections if @create_link
      add_roles_to_children if @propagate_to_children
      failed_users.blank? && failed_groups.blank?
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

    def assign_role_to_groups
      @groups.each do |group|
        role = group.add_role(@role_name, @object)
        if role.persisted?
          @added_groups << group
        else
          @failed_groups << group
        end
      end
    end

    def add_roles_to_children
      return unless @object.respond_to?(:children)
      params = [
        @added_users.map(&:id),
        @added_groups.map(&:id),
        @role_name,
        @object.id,
        @object.class.name,
      ]
      if @synchronous
        AddRolesToChildrenWorker.new.perform(*params)
      else
        AddRolesToChildrenWorker.perform_async(*params)
      end
    end

    def link_to_shared_collections
      LinkToSharedCollectionsWorker.perform_async(
        shared_user_ids,
        group_ids,
        @object.id,
        @object.class.name,
      )
    end

    def group_ids
      groups = @groups.reject(&:primary?)
      groups.map(&:id)
    end

    # NOTE: this method is duplicated w/ MassRemove
    def shared_user_ids
      groups = @groups.reject(&:primary?)
      # @groups can be an array and not a relation, try to get user_ids via relation first
      unless (group_user_ids = groups.try(:user_ids))
        group_user_ids = Group.where(id: groups.pluck(:id)).user_ids
      end
      (group_user_ids + @users.map(&:id)).uniq
    end

    def notify_users
      @added_users.each do |user|
        InvitationMailer.invite(
          user_id: user.id,
          invited_by_id: @invited_by.id,
          invited_to_type: @object.class.name,
          invited_to_id: @object.id,
        ).deliver_later
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
