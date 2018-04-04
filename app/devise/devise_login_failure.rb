class DeviseLoginFailure < Devise::FailureApp
  # Need to override respond to eliminate Devise `recall` for API auth
  def respond
    return if request.params[:controller].include? 'api/'
    store_location!
    redirect_to login_path
  end
end
