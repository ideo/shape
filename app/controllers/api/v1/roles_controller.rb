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
    is_switching = json_api_params[:is_switching]
    service = Roles::MassAssign.new(
      mass_assignment_params.merge(
        invited_by: current_user,
        new_role: !is_switching,
      ),
    )
    if service.call
      head :no_content
    else
      render_api_errors assigner.errors
    end
  end

  load_resource only: :destroy
  load_resource :user, only: :destroy
  load_resource :group, only: :destroy
  before_action :authorize_remove_role_from_record, only: :destroy
  # Remove a user or group with a role from a specific resource
  # Params:
  # - role: { name: 'editor' }
  # - user_ids: array of of users that you want to remove
  # - group_ids: array of group ids that you want to remove
  # Returns:
  # - array of roles successfully removed
  # /[collections/items/groups]/:id/roles
  def destroy
    is_switching = json_api_params[:is_switching]
    service = Roles::MassRemove.new(
      mass_assignment_params.merge(
        removed_by: current_user,
        fully_remove: !is_switching,
      ),
    )
    if service.call
      head :no_content
    else
      render_api_errors remove_roles.errors
    end
  end

  private

  def role_params
    json_api_params.require(:role).permit(:name)
  end

  def authorize_manage_record
    authorize! :manage, record
  end

  def authorize_view_record
    authorize! :read, record
  end

  def authorize_remove_role_from_record
    # you can always choose to "leave" something even if not editor
    if json_api_params[:group_ids].blank? &&
      json_api_params[:user_ids].count == 1 &&
      json_api_params[:user_ids].first.to_i == current_user.id
      return true
    end
    authorize! :manage, record
  end

  def mass_assignment_params
    users = User.where(id: json_api_params[:user_ids])
    groups = Group.where(id: json_api_params[:group_ids])
    {
      object: record,
      role_name: role_params[:name],
      users: users,
      groups: groups,
      propagate_to_children: true,
    }
  end

  def record
    @collection || @item || @group || @role.resource
  end
end
