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
    success = ::Admin::AddRoleToUsers.call(
      invited_by: current_user,
      users: users,
      send_invites: json_api_params[:send_invites]
    )

    if success
      head :no_content
    else
      render_api_errors []
    end
  end
end