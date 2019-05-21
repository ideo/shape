class Admin::DashboardController < ApplicationController
  before_action :authenticate_user!
  before_action :authorize_shape_admin!

  def index
  end
end
