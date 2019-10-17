module Roles
  class MassAssign < SimpleService
    include Roles::SharedMethods

    attr_reader :errors, :added_users, :added_groups,
                :failed_users, :failed_groups

    def initialize(object:,
                   role_name:,
                   users: [],
                   groups: [],
                   propagate_to_children: false,
                   synchronous: false,
                   invited_by: nil,
                   send_invites: true,
                   new_role: false)
      @object = object
      @role_name = role_name
      @users = users
      @groups = groups
      @propagate_to_children = propagate_to_children
      @synchronous = synchronous
      @invited_by = invited_by
      @send_invites = send_invites
      # new role, as opposed to switching roles e.g. editor/viewer on the same object
      @new_role = new_role
      @added_users = []
      @added_groups = []
      @failed_users = []
      @failed_groups = []
      @roles = []
      @errors = []
      @previous_anchor_id = nil
    end

    def call
      return false unless valid_object_and_role_name?

      unanchor_object # from shared methods
      assign_role_to_users
      setup_org_membership if newly_invited?
      notify_users if should_notify?
      assign_role_to_groups
      add_editors_as_comment_thread_followers
      add_group_members_as_comment_thread_followers
      if @new_role
        link_to_shared_collections
        link_to_connected_organization_collection
      end
      add_roles_to_children if @propagate_to_children
      create_activities_and_notifications if newly_invited?
      failed_users.blank? && failed_groups.blank?

      # If you're invited to a group, that has application and was created by application bot
      # Then call link to shared collection, on this group's first collection that has application on it
      # group -> application -> app org (+ org from group) -> application collection


    end

    private

    def newly_invited?
      @invited_by && @new_role
    end

    def should_notify?
      newly_invited? && @send_invites
    end

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

    def setup_org_membership
      @users.each do |user|
        # if it's an item, @object.organization delegates to the parent collection
        @object.organization.setup_user_membership_and_collections(user)
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
      return if @object.children.blank?

      params = [
        @invited_by.try(:id),
        @added_users.map(&:id),
        @added_groups.map(&:id),
        @role_name,
        @object.id,
        @object.class.name,
        @previous_anchor_id,
        'add',
      ]
      if @synchronous
        ModifyChildrenRolesWorker.new.perform(*params)
      else
        ModifyChildrenRolesWorker.perform_async(*params)
      end
    end

    def create_activities_and_notifications
      action = Activity.role_name_to_action(@role_name.to_sym)
      return if action.nil?

      ActivityAndNotificationBuilder.call(
        actor: @invited_by,
        target: @object,
        action: action,
        subject_user_ids: @added_users.pluck(:id),
        subject_group_ids: @added_groups.pluck(:id),
        should_notify: should_notify?,
      )
    end

    def add_editors_as_comment_thread_followers
      return unless @role_name.to_sym == Role::EDITOR
      return unless @object.item_or_collection?
      return unless @object.comment_thread.present?

      AddCommentThreadFollowers.perform_async(
        @object.comment_thread.id,
        @added_users.map(&:id),
        @added_groups.map(&:id),
      )
    end

    def add_group_members_as_comment_thread_followers
      return unless @object.is_a?(Group)

      thread_ids = @object.groups_threads.pluck(:comment_thread_id)
      return if thread_ids.empty?

      AddCommentThreadFollowers.perform_async(
        thread_ids,
        @added_users.map(&:id),
      )
    end

    def link_to_shared_collections
      LinkToSharedCollectionsWorker.perform_async(
        shared_user_ids,
        # NOTE: group_ids method here excludes Primary group
        group_ids,
        collections_to_link,
        items_to_link,
      )
    end

    # C∆ uses this to link you to an organization collection
    # if you've been added to a org group
    def link_to_connected_organization_collection
      return unless @object.is_a?(Group) && @object.application.present?

      app_org_collection_id = @object.application
                                     .application_organizations
                                     .find_by(organization_id: @object.organization_id)
                                     &.root_collection_id

      return if app_org_collection_id.blank?

      LinkToSharedCollectionsWorker.perform_async(
        shared_user_ids,
        # NOTE: group_ids method here excludes Primary group
        [],
        [app_org_collection_id],
        [],
      )
    end

    def notify_users
      @added_users.each do |user|
        # skip people who have opted out
        next unless user.notify_through_email

        InvitationMailer.invite(
          user_id: user.id,
          invited_by_id: @invited_by.id,
          invited_to_type: @object.class.base_class.name,
          invited_to_id: @object.id,
          application: object_application,
        ).deliver_later
      end
    end

    def object_application
      return unless @object.respond_to?(:created_by) &&
                    @object.created_by.present? &&
                    @object.created_by.application_bot?

      @object.created_by.application
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
