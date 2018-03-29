class Api::V1::OrganizationsController < Api::V1::BaseController
  deserializable_resource :organization, only: :update
  load_and_authorize_resource

  # The logged-in user's current organization context
  def current
    render jsonapi: current_organization, include: [:primary_group]
  end

  def show
    render jsonapi: @organization
  end

  def update
    @organization.attributes = organization_params
    if @organization.save
      render jsonapi: @organization
    else
      render_api_errors @organization.errors
    end
  end

  private

  def organization_params
    params.require(:organization).permit(
      :name,
      filestack_file_attributes: Organization.filestack_file_attributes_whitelist,
    )
  end
end
