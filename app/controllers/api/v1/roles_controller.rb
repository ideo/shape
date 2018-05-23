class Api::V1::RolesController < Api::V1::BaseController
  load_resource :collection
  load_resource :item
  load_resource :group

  before_action :authorize_view_record, only: :index
  # All roles that exist on this resource (collection, item or group)
  # /[collections/items/group]/:id/roles
  def index
    @roles = record.roles.includes(:users, :groups, :resource)
    render jsonapi: @roles, include: %i[users groups resource]
  end

  before_action :authorize_manage_record, only: :create
  # Create role(s) on this resource (collection, item or group)
  # Params:
  # - role: { name: 'editor' }
  # - user_ids: array of of users that you want to assign
  # - group_ids: array of group ids that you want to assign
  # Returns:
  # - array of roles successfully created, including users with that role
  # /[collections/items/groups]/:id/roles
  def create
    users = User.where(id: json_api_params[:user_ids])
    groups = Group.where(id: json_api_params[:group_ids])
    assigner = Roles::MassAssign.new(
      object: record,
      role_name: role_params[:name],
      current_user: current_user,
      users: users,
      groups: groups,
      propagate_to_children: true,
      invited_by: current_user,
      new_role: !json_api_params[:is_switching],
    )
    if assigner.call
      render jsonapi: record.roles.reload, include: %i[users groups resource]
    else
      render_api_errors assigner.errors
    end
  end

  load_resource only: :destroy
  load_resource :user, only: :destroy
  load_resource :group, only: :destroy
  before_action :authorize_remove_role_from_resource, only: :destroy
  # Remove a user or group with a role from a specific resource
  # /users/:id/roles/:id
  # /groups/:id/roles/:id
  def destroy
    if remove_role(role: @role, user: @user, group: @group, is_switching:
                  json_api_params[:is_switching])
      render jsonapi: @role.resource.roles.reload, include: %i[users groups resource]
    else
      render_api_errors remove_roles.errors
    end
  end

  private

  def remove_role(role:, user: nil, group: nil, is_switching: false)
    resource = role.resource

    Roles::MassRemove.new(
      object: resource,
      role_name: role.name,
      users: [user].compact,
      groups: [group].compact,
      remove_from_children_sync: false,
      remove_link: !is_switching,
    ).call
  end

  def role_params
    json_api_params.require(:role).permit(
      :name,
      :is_switching,
    )
  end

  def authorize_manage_record
    authorize! :manage, record
  end

  def authorize_view_record
    authorize! :read, record
  end

  def authorize_remove_role_from_resource
    return true if @user && @user.id == current_user.id
    authorize! :manage, @role.resource
  end

  def record
    @collection || @item || @group || @role.resource
  end
end
