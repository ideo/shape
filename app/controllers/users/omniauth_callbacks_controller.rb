class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  def okta
    @user = User.from_omniauth(request.env['omniauth.auth'])
    if @user.save
      add_user_to_org_if_none(@user)
      # this will throw if @user is not activated
      sign_in_and_redirect @user, event: :authentication
    else
      # set_flash_message(:alert, @user.errors.full_messages.first, :kind => 'OKTA') if is_navigational_format?
      redirect_to root_path
    end
  end

  private

  # Temporary method while we are testing the app
  # Automatically add user to first organization
  def add_user_to_org_if_none(user)
    return if user.current_organization_id.present?

    org = Organization.first
    user.add_role(Role::MEMBER, org.primary_group)
  end
end
