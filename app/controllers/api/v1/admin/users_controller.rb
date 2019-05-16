class Api::V1::Admin::UsersController < Api::V1::BaseController
  before_action :authorize_shape_admin!

  def index
    render jsonapi: User.with_role(Role::SHAPE_ADMIN)
  end

  def destroy
    user = User.find(params[:id])
    if user.remove_role(Role::SHAPE_ADMIN)
      head :no_content
    else
      render_api_errors user.errors
    end
  end

  def create
    users = User.where(id: json_api_params[:user_ids])
    if ::Admin::AddRoleToUsers.call(users: users)
      head :no_content
    else
      render_api_errors []
    end
  end
end