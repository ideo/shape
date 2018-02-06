class Api::V1::OrganizationsController < Api::V1::BaseController
  deserializable_resource :organization, only: :update
  load_and_authorize_resource

  def show
    render jsonapi: @organization
  end

  def update
    @organization.attributes = organization_params
    if @organization.save
      render jsonapi: @organization
    else
      render jsonapi_errors: @organization.errors.full_messages
    end
  end

  private

  def organization_params
    params.require(:organization).permit(
      :name
    )
  end
end
