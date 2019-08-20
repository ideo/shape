module Admin
  class AddRoleToUsers < SimpleService
    attr_reader :added_users, :failed_users

    def initialize(invited_by:, users:, send_invites:)
      @invited_by = invited_by
      @users = users
      @send_invites = send_invites
      @added_users = []
      @failed_users = []
    end

    def call
      assign_role_to_users
      send_invitation_emails if @send_invites
      failed_users.blank?
    end

    private

    def assign_role_to_users
      @users.each do |user|
        role = user.add_role(Role::SHAPE_ADMIN)
        if role.persisted?
          @added_users << user
        else
          @failed_users << user
        end
      end
    end

    def send_invitation_emails
      invited_to_type = Role::SHAPE_ADMIN.to_s.titleize

      added_users.each do |user|
        # skip people who have opted out
        next unless user.notify_through_email

        InvitationMailer.invite(
          user_id: user.id,
          invited_by_id: @invited_by.id,
          invited_to_type: invited_to_type,
        ).deliver_later
      end
    end
  end
end
