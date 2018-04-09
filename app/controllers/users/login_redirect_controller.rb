# Override Devise controller so that /users/[sign_in/new] are not valid routes
class Users::LoginRedirectController < Devise::SessionsController
  before_action :redirect_to_profile_login

  private

  def redirect_to_profile_login
    redirect_to login_url
  end
end
