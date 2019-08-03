class ApplicationController < ActionController::Base
  # protect_from_forgery with: :exception

  attr_reader :redirect_organization
  helper_method :redirect_organization

  rescue_from CanCan::AccessDenied do |exception|
    redirect_to root_url, alert: exception.message
  end

  def authenticate_super_admin!
    authenticate_user!
    head(:unauthorized) unless current_user.has_cached_role?(Role::SUPER_ADMIN)
  end

  def authorize_shape_admin!
    raise CanCan::AccessDenied unless current_user.has_cached_role?(Role::SHAPE_ADMIN) || current_user.has_cached_role?(Role::SUPER_ADMIN)
  end

  def load_redirect_organization_from_url(url)
    regex = /^\/([a-z0-9\-\_]+)/i
    org_slug = URI.parse(url).path.match(regex).try(:[], 1)
    return if org_slug.blank?

    @redirect_organization = Organization.friendly.find(org_slug)
  rescue ActiveRecord::RecordNotFound
    # no-op, organization not found by slug
  end
end
