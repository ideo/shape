class Api::V1::RolesController < Api::V1::BaseController
  # don't need to load records on destroy because it's nested under the user
  load_resource :collection, except: :destroy
  load_resource :item, except: :destroy
  load_resource only: %i[destroy]
  load_resource :user, only: :destroy
  before_action :authorize_manage_record, except: :index
  before_action :authorize_view_record, only: :index

  # All roles that exist on this resource (collection or item)
  # /[collections/items]/:id/roles
  def index
    @roles = record.roles.includes(:users, :resource)
    render jsonapi: @roles, include: %i[users resource]
  end

  # Create role(s) on this resource (collection or item)
  # Params:
  # - role: { name: 'editor' }
  # - user_ids: array of of users that you want to assign
  # Returns:
  # - array of roles successfully created, including users with that role
  # /[collections/items]/:id/roles
  def create
    users = User.where(id: json_api_params[:user_ids]).to_a
    assigner = Roles::AssignToUsers.new(
      object: record,
      role_name: role_params[:name],
      users: users,
    )
    if assigner.call
      render jsonapi: record.roles, include: %i[users resource]
    else
      render_api_errors assigner.errors
    end
  end

  # Remove a user role from a specific resource
  # /users/:id/roles/:id
  def destroy
    # We want to call remove_role instead of deleting the UserRole
    # So that role lifecycle methods are called
    if @user.present? && @user.remove_role(@role.name, @role.resource)
      render jsonapi: @role
    else
      render_api_errors @user.errors
    end
  end

  private

  def json_api_params
    params[:_jsonapi]
  end

  def role_params
    json_api_params.require(:role).permit(
      :name,
    )
  end

  def authorize_manage_record
    authorize! :manage, record
  end

  def authorize_view_record
    authorize! :read, record
  end

  def record
    @collection || @item || @role.resource
  end
end
