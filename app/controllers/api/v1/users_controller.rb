class Api::V1::UsersController < Api::V1::BaseController
  load_and_authorize_resource except: :me

  def show
    render jsonapi: @user, include: %i[current_organization]
  end

  def me
    render jsonapi: current_user, include: %i[current_organization]
  end
end
