module SessionHelper
  def log_in_as_user(user = nil)
    @user ||= user || create(:user)
    login_as(@user, scope: :user)
    @user
  end

  def log_in_with_api_token
    @api_token ||= create(:api_token)
    login_as(@api_token.application.user)
  end

  # This used to be a method on Organization -- no longer used outside of tests
  def create_org_for_user(user)
    name = [user.first_name, user.last_name, 'Organization'].compact.join(' ')
    builder = OrganizationBuilder.new({ name: name }, user, full_setup: false)
    builder.save
    builder.organization
  end
end
