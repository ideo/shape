class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  def ideo
    if session[:pending_user_token]
      # if this is nil for whatever reason, it will later end up creating a new User
      pending_user = User.pending_user_with_token(session[:pending_user_token])
      session[:pending_user_token] = nil
    end
    @user = User.from_omniauth(request.env['omniauth.auth'], pending_user)
    if @user.save
      setup_org_membership
      setup_network_roles
      # this will throw if @user is not activated
      # will also redirect to stored path from any previous 401
      sign_in_and_redirect @user, event: :authentication
    else
      redirect_to root_path
    end
  end

  def failure
    redirect_to root_path
  end

  private

  def setup_network_roles
    return unless @user.current_organization.present? &&
                  @user.has_role?(Role::ADMIN, @user.current_organization.admin_group)

    @user.add_network_admin(@user.current_organization.id)
  end

  def setup_org_membership
    return unless @user.current_organization.present?

    # double check if they're now signed in with a whitelisted email
    @user.current_organization.check_user_email_domain(@user)
  end
end
