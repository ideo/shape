class Api::V1::AudiencesController < Api::V1::BaseController
  load_and_authorize_resource :audience, only: %i[index show]
  load_and_authorize_resource :organization, only: %i[index]

  before_action :load_user_audiences, only: %i[index]
  def index
    render jsonapi: @audiences
  end

  def show
    render jsonapi: @audience
  end

  private

  def load_user_audiences
    @audiences = Audience
                 .where(organization_id: nil)
                 .or(Audience.where(organization_id: @organization.id))
  end
end
