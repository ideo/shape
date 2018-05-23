class Api::V1::GroupsController < Api::V1::BaseController
  deserializable_resource :group, class: DeserializableGroup, only: %i[create update]
  load_and_authorize_resource :organization, only: %i[index]
  load_and_authorize_resource

  # All the current user's groups in this org
  # /organizations/:id/groups
  def index
    render jsonapi: current_user.groups.where(organization_id: @organization.id).order(name: :asc)
  end

  def show
    render jsonapi: @group, include: [roles: %i[users groups]]
  end

  before_action :authorize_current_organization, only: %i[create]
  def create
    @group.organization = current_organization
    if @group.save
      current_user.add_role(Role::ADMIN, @group)
      render jsonapi: @group.reload, include: [roles: [:users]]
    else
      render_api_errors @group.errors
    end
  end

  def update
    @group.attributes = group_params
    if @group.save
      render jsonapi: @group
    else
      render_api_errors @group.errors
    end
  end

  def archive
    if @group.archive!
      ActivityAndNotificationBuilder.new(
        actor: current_user,
        target: @group,
        action: Activity.actions[:archived],
        subject_users: @group.members[:users] + @group.admins[:users],
        subject_groups: [],
      ).call
      render jsonapi: @group.reload
    else
      render_api_errors @group.errors
    end
  end

  private

  def authorize_current_organization
    authorize! :manage, current_organization
  end

  def group_params
    params.require(:group).permit(
      :name,
      :handle,
      filestack_file_attributes: Group.filestack_file_attributes_whitelist,
    )
  end
end
