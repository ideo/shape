class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  def okta
    @user = User.from_omniauth(request.env['omniauth.auth'])
    if @user.save
      create_org_if_none(@user)
      # this will throw if @user is not activated
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

  def create_org_if_none(user)
    return if user.current_organization_id.present?

    Organization.create_for_user(user)
  end
end
