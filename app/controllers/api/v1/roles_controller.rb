class Api::V1::RolesController < Api::V1::BaseController
  # don't need to load records on destroy because it's nested under the user
  load_resource :collection, except: :destroy
  load_resource :item, except: :destroy
  load_resource :group, except: :destroy
  load_resource only: %i[destroy]
  load_resource :user, only: :destroy
  before_action :authorize_manage_record, except: :index
  before_action :authorize_view_record, only: :index

  # All roles that exist on this resource (collection, item or group)
  # /[collections/items/group]/:id/roles
  def index
    @roles = record.roles.includes(:users, :groups, :resource)
    render jsonapi: @roles, include: %i[users groups resource]
  end

  # Create role(s) on this resource (collection, item or group)
  # Params:
  # - role: { name: 'editor' }
  # - user_ids: array of of users that you want to assign
  # - group_ids: array of group ids that you want to assign
  # Returns:
  # - array of roles successfully created, including users with that role
  # /[collections/items]/:id/roles
  def create
    users = User.where(id: json_api_params[:user_ids]).to_a
    groups = User.where(id: json_api_params[:group_ids]).to_a
    assigner = Roles::MassAssign.new(
      object: record,
      role_name: role_params[:name],
      users: users,
      groups: groups,
      propagate_to_children: true,
    )
    if assigner.call
      render jsonapi: record.roles, include: %i[users groups resource]
    else
      render_api_errors assigner.errors
    end
  end

  # Remove a user role from a specific resource
  # /users/:id/roles/:id
  def destroy
    # We want to call remove_role instead of deleting the UserRole
    # So that role lifecycle methods are called
    if @user.present? && remove_role(user: @user, role: @role)
      render jsonapi: record.roles, include: %i[users resource]
    else
      render_api_errors @user.errors
    end
  end

  private

  def remove_role(user:, role:)
    resource = role.resource

    return false unless user.remove_role(role.name, resource)

    RemoveRolesFromChildrenWorker.perform_async(
      [role.id],
      resource.id,
      resource.class.name.to_s,
    )

    true
  end

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
    @collection || @item || @group || @role.resource
  end
end
