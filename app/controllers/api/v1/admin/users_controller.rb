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
      send_invites: json_api_params[:send_invites],
    )

    if success
      head :no_content
    else
      render_api_errors []
    end
  end

  def search
    audience = Audience.find(params[:audience_id])
    users = User.tagged_with(audience.tag_list)
                .left_outer_joins(:test_audience_invitations)
                .select('users.*, MAX(test_audience_invitations.created_at) AS date_of_participation')
                .group('users.id')
                .order('date_of_participation ASC')
                .uniq
    render jsonapi: sort_users(users)
  end

  private

  def sort_users(users)
    users.sort do |u1, u2|
      if u1.date_of_participation.nil? && u2.date_of_participation.nil?
        0
      elsif u1.date_of_participation.nil?
        -1
      elsif u2.date_of_participation.nil?
        1
      else
        u1.date_of_participation <=> u2.date_of_participation
      end
    end
  end
end
