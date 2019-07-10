class DemographicsConfig
  attr_reader :config

  def initialize
    @config = YAML.load_file('demographics-config.yml')
  end

  # returns [<group, name, categoryKey, criteria => [<name, criteriaKey>, ...]>, ...]
  def query_categories
    @config['query_categories'].map do |category|
      {
        group: category['group'],
        name: category['name'],
        categoryKey: category['category_key'],
        criteria: category['criteria'].map do |criterion|
          {
            name: criterion['name'],
            criteriaKey: criterion['criteria_key'],
          }
        end,
      }
    end
  end
end

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

  def foobar
    config = DemographicsConfig.new
    render json: config.config
  end

  def query_categories
    config = DemographicsConfig.new
    render json: config.query_categories
  end

  private

  def load_org_audiences
    @audiences = Audience
                 .includes(:base_tags)
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
