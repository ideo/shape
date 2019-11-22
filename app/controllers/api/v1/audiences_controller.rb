class Api::V1::AudiencesController < Api::V1::BaseController
  deserializable_resource :audience, class: DeserializableAudience, only: %i[create]
  load_and_authorize_resource :audience, only: %i[show]
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
    @audience.min_price_per_response = Audience::TARGETED_AUDIENCE_MIN_PRICE_PER_RESPONSE
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
                 .includes(:base_tags, :organizations)
                 .viewable_by_user_in_org(user: current_user, organization: @organization)
  end

  def authorize_current_organization
    authorize! :read, current_organization
  end

  def audience_params
    params.require(:audience).permit(
      :name,
      age_list: [],
      children_age_list: [],
      country_list: [],
      education_level_list: [],
      gender_list: [],
      adopter_type_list: [],
      interest_list: [],
      publication_list: [],
    )
  end
end
