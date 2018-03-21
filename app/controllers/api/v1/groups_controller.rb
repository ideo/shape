class Api::V1::GroupsController < Api::V1::BaseController
  deserializable_resource :group, class: DeserializableGroup, only: %i[create update]
  load_and_authorize_resource :organization, only: %i[index]
  load_and_authorize_resource

  # All the groups in this org
  # /organizations/:id/groups
  def index
    render jsonapi: @organization.groups.order(name: :asc)
  end

  def show
    render jsonapi: @group, include: %i[admins members]
  end

  def create
    @group.organization = current_organization
    if @group.save
      render jsonapi: @group
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

  private

  def group_params
    params.require(:group).permit(
      :name,
      :handle,
      filestack_file_attributes: Group.filestack_file_attributes_whitelist,
    )
  end
end
