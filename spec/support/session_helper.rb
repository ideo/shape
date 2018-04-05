module SessionHelper
  def log_in_as_user(user = nil)
    @user ||= user || create(:user, add_to_org: create(:organization))
    login_as(@user, scope: :user)
    @user
  end
end
