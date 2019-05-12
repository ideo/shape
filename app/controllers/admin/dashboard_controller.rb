class Admin::DashboardController < ApplicationController
  before_action :authenticate_user!

  def index
    raise CanCan::AccessDenied unless current_user.has_role?(Role::SHAPE_ADMIN)
  end
end