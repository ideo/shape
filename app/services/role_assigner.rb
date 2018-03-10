class RoleAssigner
  attr_reader :roles, :errors

  def initialize(object:, role_name:, user_ids: [], emails: [])
    @object = object
    @role_name = role_name
    @user_ids = user_ids
    @emails = emails.map(&:downcase) if emails.present?
    @users = []
    @roles = []
    @failed_users = []
    @failed_emails = []
    @errors = []
  end

  def call
    if valid_role_and_object?
      find_or_create_users_for_emails if emails.present?
      find_users_by_id if user_ids.present?
      assign_role_to_users if users.present?
    end

    {
      roles: roles,
      failed_user_ids: failed_user_ids,
      failed_emails: failed_emails,
    }
  end

  private

  attr_reader :object, :role_name, :user_ids, :emails, :users,
              :failed_user_ids, :failed_emails

  def valid_role_and_object?
    unless resourceable_object?
      @errors << "You can't assign roles to that object"
    end

    unless valid_role_name?
      @errors << "#{role_name} is not a valid role"
    end

    @errors.blank?
  end

  def valid_role_name?
    object.class.resourceable_roles.include?(role_name.to_sym)
  end

  def resourceable_object?
    object.is_a?(Resourceable)
  end

  def assign_role_to_users
    users.each do |user|
      role = user.add_role(role_name, object.becomes(object.resourceable_class))
      if role.persisted?
        @roles << role
      else
        @failed_users << user
      end
    end
  end

  def find_users_by_id
    @users += User.where(id: user_ids)
  end

  def find_or_create_users_for_emails
    # Get users for those that already have an account
    found = User.where(email: emails)
    @users += found

    # Create pending users for any that we don't have an account for
    (emails - found.map(&:email)).each do |email|
      user = User.create_pending_from_email(email)
      if user.persisted?
        @users << user
      else
        @failed_emails << email
      end
    end
  end
end
