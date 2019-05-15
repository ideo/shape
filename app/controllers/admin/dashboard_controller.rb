class Admin::DashboardController < ApplicationController
  before_action :authenticate_user!

  def index
    raise CanCan::AccessDenied unless current_user.has_cached_role?(Role::SHAPE_ADMIN) || current_user.has_cached_role?(Role::SUPER_ADMIN)
  end
end