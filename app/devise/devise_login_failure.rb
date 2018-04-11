class DeviseLoginFailure < Devise::FailureApp
  # Need to override respond to eliminate Devise `recall` for API auth
  def respond
    return if request.params.present? && request.params[:controller].include?('api/')
    if request.path == '/sidekiq/unauthenticated'
      return super
    end
    store_location!
    redirect_to login_url
  end
end
