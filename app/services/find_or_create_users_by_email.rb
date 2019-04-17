class FindOrCreateUsersByEmail
  attr_reader :failed_emails, :users

  def initialize(emails:)
    @emails = emails.map { |email| email.strip.downcase }
    @failed_emails = []
    @users = []
  end

  def call
    find_existing_users
    create_pending_users
    failed_emails.blank?
  end

  private

  attr_reader :emails

  def find_existing_users
    @users += User.where(email: emails).to_a
    # Remove existing users from emails
    @emails -= users.map(&:email)
  end

  def create_pending_users
    emails.each do |email|
      user = User.create_pending_user(email: email)
      if user.persisted?
        users << user
      else
        failed_emails << email
      end
    end
  end
end
