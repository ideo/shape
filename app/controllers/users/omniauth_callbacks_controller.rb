class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  def ideo
    @user = User.from_omniauth(request.env['omniauth.auth'])
    if @user.save
      unless @user.limited?
        setup_org_membership
        setup_network_roles
      end
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
    # check if they are signed in with an autojoinable domain
    OrganizationAutojoiner.new(@user).autojoin
    return unless @user.current_organization.present?

    # double check if they're now signed in with a whitelisted email
    # TODO: will not need this when we lock invitations to the invited email
    @user.current_organization.check_email_domains_and_join_org_group(@user)
  end
end
