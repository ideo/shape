class Api::V1::RolesController < Api::V1::BaseController
  load_resource :collection
  load_resource :item
  load_resource :group

  before_action :authorize_view_record, only: :index
  # All roles that exist on this resource (collection, item or group)
  # /[collections/items/group]/:id/roles
  def index
    @roles = record.roles.includes(:resource)
    render jsonapi: @roles, include: %i[users groups resource]
  end

  before_action :authorize_manage_record, :check_freemium_limit, only: :create
  # Create role(s) on this resource (collection, item or group)
  # Params:
  # - role: { name: 'editor' }
  # - user_ids: array of of users that you want to assign
  # - group_ids: array of group ids that you want to assign
  # Returns:
  # - array of roles successfully created, including users with that role
  # /[collections/items/groups]/:id/roles
  def create
    is_switching = root_object_params[:is_switching]
    service = Roles::MassAssign.new(
      mass_assignment_params.merge(
        invited_by: current_user,
        new_role: !is_switching,
        send_invites: send_invites_bool,
      ),
    )
    if service.call
      head :no_content
    else
      render_api_errors service.errors.map.with_index do |message, i|
        JSONAPI::Serializable::Error.create(
          id: i,
          title: message,
        )
      end
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
    is_switching = root_object_params[:is_switching]
    service = Roles::MassRemove.new(
      mass_assignment_params.merge(
        removed_by: current_user,
        fully_remove: !is_switching,
      ),
    )
    if service.call
      if root_object_params[:mark_private]
        record.mark_as_private!
      end
      head :no_content
    else
      render_api_errors remove_roles.errors
    end
  end

  def will_become_private
    parent = record.parent
    inheritance = Roles::Inheritance.new(parent)
    remove_identifiers = if params[:remove_identifiers].is_a?(Array)
                           params[:remove_identifiers]
                         else
                           [params[:remove_identifiers]]
                         end
    if parent.nil? || parent.is_a?(Collection::UserCollection)
      inherit = true
    else
      inherit = inheritance.inherit_from_parent?(
        record,
        remove_identifiers: remove_identifiers,
        role_name: params[:role_name],
      )
    end
    render json: !inherit
  end

  private

  # This is necessary because the front-end doesn't use JSON:API spec,
  # but our Shape Ruby SDK does
  def root_object_params
    return json_api_params if json_api_params[:data].blank?

    json_api_params[:data][:attributes]
  end

  def role_params
    root_object_params.require(:role).permit(:name)
  end

  def authorize_manage_record
    authorize! :manage, record
  end

  def check_freemium_limit
    return unless root_object_params[:user_ids].present?
    return if current_organization.has_payment_method || !current_organization.in_app_billing

    users_to_add_count = root_object_params[:user_ids].length
    over_limit = current_organization.active_users_count + users_to_add_count > Organization::FREEMIUM_USER_LIMIT
    if over_limit
      head :unauthorized
    end
  end

  def authorize_view_record
    authorize! :read, record
  end

  def authorize_remove_role_from_record
    # you can always choose to "leave" something even if not editor
    if root_object_params[:group_ids].blank? &&
       root_object_params[:user_ids].count == 1 &&
       root_object_params[:user_ids].first.to_i == current_user.id
      return true
    end

    authorize! :manage, record
  end

  def mass_assignment_params
    users = User.where(id: root_object_params[:user_ids])
    groups = Group.where(id: root_object_params[:group_ids])
    if current_api_token&.application.present?
      org_ids = current_api_token.application.organization_ids
      if org_ids.present?
        groups = groups.where(organization_id: org_ids)
      else
        groups = groups.none
      end
    else
      groups = groups.viewable_in_org(current_organization.id)
    end

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

  def send_invites_bool
    return true unless root_object_params.key?(:send_invites)

    root_object_params[:send_invites]
  end
end
