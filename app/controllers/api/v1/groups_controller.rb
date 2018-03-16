class Api::V1::GroupsController < Api::V1::BaseController
  deserializable_resource :group, class: DeserializableGroup, only: %i[create update]
  load_and_authorize_resource

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
      :tag,
    )
  end
end
