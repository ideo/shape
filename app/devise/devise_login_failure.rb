class DeviseLoginFailure < Devise::FailureApp
  # Need to override respond to eliminate Devise `recall` for API auth
  def respond
    return if request.params.present? && request.params[:controller].include?('api/')
    return super if request.path == '/sidekiq/unauthenticated'

    redirect_url = login_url
    if request.params[:controller] == 'templates' && request.params[:action] == 'use_in_my_collection'
      redirect_url = sign_up_url
    end
    store_location!
    redirect_to redirect_url
  end
end
