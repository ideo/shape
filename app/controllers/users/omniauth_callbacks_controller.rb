class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  def okta
    if session[:pending_user_token]
      # if this is nil for whatever reason, it will later end up creating a new User
      pending_user = User.pending_user_with_token(session[:pending_user_token])
      session[:pending_user_token] = nil
    end
    @user = User.from_omniauth(request.env['omniauth.auth'], pending_user)
    if @user.save
      setup_org_membership(@user)
      # this will throw if @user is not activated
      # will also redirect to stored path from any previous 401
      sign_in_and_redirect @user, event: :authentication
    else
      # set_flash_message(:alert, @user.errors.full_messages.first, :kind => 'OKTA') if is_navigational_format?
      redirect_to root_path
    end
  end

  def failure
    redirect_to root_path
  end

  private

  def setup_org_membership(user)
    if @user.current_organization.present?
      # double check if they're now signed in with a whitelisted email
      @user.current_organization.setup_user_membership(@user, doublecheck: true)
    else
      Organization.create_for_user(user)
    end
  end
end
