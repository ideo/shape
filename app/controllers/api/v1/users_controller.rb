class Api::V1::UsersController < Api::V1::BaseController
  def show
    render jsonapi: @user
  end
end
