class DeviseApiFailure < Devise::FailureApp
  # You need to override respond to eliminate recall
  def respond
    return if request.params[:controller].include? 'api/'
    redirect_to login_path
  end
end
