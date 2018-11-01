class ApplicationController < ActionController::Base
  # protect_from_forgery with: :exception

  rescue_from CanCan::AccessDenied do |exception|
    redirect_to root_url, alert: exception.message
  end

  def authenticate_super_admin!
    authenticate_user!
    head(401) unless current_user.has_cached_role?(Role::SUPER_ADMIN)
  end
end
