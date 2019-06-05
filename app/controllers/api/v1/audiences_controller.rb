class Api::V1::AudiencesController < Api::V1::BaseController
  deserializable_resource :audience, class: DeserializableAudience, only: %i[create]
  load_and_authorize_resource :audience, only: %i[index show]
  load_and_authorize_resource :organization, only: %i[index]

  before_action :load_org_audiences, only: %i[index]
  def index
    render jsonapi: @audiences
  end

  def show
    render jsonapi: @audience
  end

  before_action :authorize_current_organization, only: %i[create]
  def create
    @audience = Audience.new(audience_params)
    @audience.price_per_response = Shape::TARGETED_AUDIENCE_PRICE_PER_RESPONSE
    @audience.organizations << current_organization
    if @audience.save
      render jsonapi: @audience.reload
    else
      render_api_errors @audience.errors
    end
  end

  private

  def load_org_audiences
    @audiences = Audience
                 .includes(:organizations)
                 .where(organizations: { id: nil })
                 .or(Audience.includes(:organizations).where(organizations: { id: @organization.id }))
                 .order(price_per_response: :asc)
  end

  def authorize_current_organization
    authorize! :manage, current_organization
  end

  def audience_params
    params.require(:audience).permit(:name, :tag_list)
  end
end
