class Api::V1::UsersController < Api::V1::BaseController
  load_and_authorize_resource

  def show
    render jsonapi: @user
  end

  def me
    render jsonapi: current_user
  end
end
