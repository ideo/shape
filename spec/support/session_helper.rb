module SessionHelper
  def log_in_as_user(user = nil)
    @user ||= user || create(:user)
    login_as(@user, scope: :user)
  end
end
