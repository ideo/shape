class Api::V1::GroupsController < Api::V1::BaseController
  deserializable_resource :group, class: DeserializableGroup, only: %i[create update]
  before_action :load_current_organization_from_nested_routes, only: %i[index create]
  load_and_authorize_resource except: :index

  # All the current user's groups in this org
  # /organizations/:id/groups
  before_action :load_user_groups, only: %i[index]
  before_action :load_and_filter_index, only: %i[index]
  def index
    # TODO: handle group_ids parameter
    if current_organization.blank?
      render json: { errors: ['Organization is required'] }, status: :bad_request
    else
      render jsonapi: @groups
    end
  end

  def show
    render jsonapi: @group, include: [roles: %i[users groups]]
  end

  before_action :check_group_organization_param, only: %i[create]
  before_action :authorize_current_organization, only: %i[create]
  def create
    external_id = params[:group].delete(:external_id)
    @group.organization ||= current_organization
    @group.created_by = current_user
    @group.application = current_application
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

  def check_group_organization_param
    organization_id = params[:group].delete(:organization_id)
    return unless organization_id.present?

    @current_organization = Organization.find_by(id: organization_id)
  end

  def authorize_current_organization
    authorize! :read, current_organization
  end

  def load_user_groups
    if current_organization.blank?
      @groups = []
    elsif current_api_token.present?
      # Allow them access to any group in the org,
      # the user doesn't have to be an admin on it
      @groups = Group.where(organization_id: current_organization.id)
                     .order(name: :asc)
                     .includes(:application)
    else
      @groups = current_user.groups
                            .where(organization_id: current_organization.id)
                            .order(name: :asc)
                            .includes(:application)
    end
  end

  def group_params
    params.require(:group).permit(
      :name,
      :handle,
      filestack_file_attributes: Group.filestack_file_attributes_whitelist,
    )
  end

  def load_current_organization_from_nested_routes
    return if params[:organization_id].blank?

    org = Organization.find_by(id: params[:organization_id])
    # Authorize they have access
    authorize! :read, org
    @current_organization = org
  end
end
