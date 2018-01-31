class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  def okta
    # You need to implement the method below in your model (e.g. app/models/user.rb)
    # TODO: Can't get OKTA to consistently provide "email" field as part of
    #       User's Profile info, sometimes it's blank which requires this workaround
    email = request.env['omniauth.auth'].try(:info).try(:email) || request.env['omniauth.auth'].try(:extra).try(:id_info).try(:sub)
    @user = User.from_omniauth(email, request.env['omniauth.auth'])
    if @user.persisted? || @user.save
      # this will throw if @user is not activated
      sign_in_and_redirect @user, event: :authentication
    else
      # set_flash_message(:alert, @user.errors.full_messages.first, :kind => 'OKTA') if is_navigational_format?
      redirect_to root_path
    end
  end
end
