class Api::V1::GroupsController < Api::V1::BaseController
  deserializable_resource :group, class: DeserializableGroup, only: %i[create update]
  load_and_authorize_resource :organization, only: %i[index]
  load_and_authorize_resource

  # All the current user's groups in this org
  # /organizations/:id/groups
  before_action :apply_filters, only: %i[index]
  def index
    # may have already prepopulated @groups in `apply_filters`
    if @groups.nil?
      organization_id = @organization.try(:id) || current_organization.id
      @groups = current_user.groups.where(organization_id: organization_id).order(name: :asc)
    end
    render jsonapi: @groups
  end

  def show
    render jsonapi: @group, include: [roles: %i[users groups]]
  end

  before_action :check_group_organization, only: %i[create]
  before_action :authorize_current_organization, only: %i[create]
  def create
    external_id = params[:group].delete(:external_id)
    @group.organization = current_organization
    if external_id.present? && current_user.application
      @group.external_records.build(
        external_id: external_id,
        application: current_user.application,
      )
    end
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
      ActivityAndNotificationBuilder.call(
        actor: current_user,
        target: @group,
        action: :archived,
        subject_user_ids: @group.members[:users].pluck(:id) + @group.admins[:users].pluck(:id),
      )
      render jsonapi: @group.reload
    else
      render_api_errors @group.errors
    end
  end

  private

  def check_group_organization
    organization_id = params[:group].delete(:organization_id)
    return unless organization_id.present?
    organization = Organization.find(organization_id)
    authorize! :read, organization
    current_user.switch_to_organization(organization)
    @current_organization = organization
  end

  def authorize_current_organization
    authorize! :read, current_organization
  end

  def group_params
    params.require(:group).permit(
      :name,
      :handle,
      filestack_file_attributes: Group.filestack_file_attributes_whitelist,
    )
  end
end
