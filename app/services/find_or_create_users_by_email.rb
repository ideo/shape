class FindOrCreateUsersByEmail
  attr_reader :failed_emails, :users, :emails

  def initialize(emails:, invited_by:)
    @emails = emails.map { |email| email.strip.downcase }
    @failed_emails = []
    @users = []
    @invited_by = invited_by
    @organization_id = @invited_by.current_organization_id
  end

  def call
    find_existing_users
    create_pending_users
    @failed_emails.blank?
  end

  private

  def find_existing_users
    @users += User.where(email: emails).to_a
    # Remove existing users from emails
    @emails -= users.map(&:email)
  end

  def create_pending_users
    invitations = NetworkApi::Invitation.bulk_create(
      organization_id: @organization_id,
      invited_by_uid: @invited_by.uid,
      emails: @emails,
    )
    if invitations.empty?
      # NetworkApi call didn't work
      @failed_emails = @emails
      return
    end

    invitations.each do |invitation|
      if invitation.token.nil?
        @failed_emails << invitation.email
        next
      end

      user = User.create_pending_user(
        invitation: invitation,
        organization_id: @organization_id,
      )
      if user.persisted?
        users << user
        user.sync_network_groups
      else
        @failed_emails << invitation.email
      end
    end
  end
end
