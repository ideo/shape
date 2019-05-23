class Api::V1::AudiencesController < Api::V1::BaseController
  deserializable_resource :audience, class: DeserializableAudience, only: %i[create]
  load_and_authorize_resource :audience, only: %i[index show]
  load_and_authorize_resource :organization, only: %i[index]

  before_action :load_user_audiences, only: %i[index]
  def index
    render jsonapi: @audiences
  end

  def show
    render jsonapi: @audience
  end

  before_action :authorize_current_organization, only: %i[create]
  def create
    @audience = Audience.new(audience_params)
    @audience.price_per_response = Audience::TARGETED_PRICE_PER_RESPONSE
    @audience.organization = current_organization
    if @audience.save
      render jsonapi: @audience.reload
    else
      render_api_errors @audience.errors
    end
  end

  private

  def load_user_audiences
    @audiences = Audience
                 .where(organization_id: nil)
                 .or(Audience.where(organization_id: @organization.id))
  end

  def authorize_current_organization
    authorize! :manage, current_organization
  end

  def audience_params
    params.require(:audience).permit(:name)
  end
end
