class Api::V1::BaseController < ApplicationController
  before_action :check_api_authentication!
  before_action :check_cancel_sync
  before_action :check_page_param

  respond_to :json

  # See all configuration options for the jsonapi in the jsonapi-rb-rails gem

  # jsonapi-rb has issues inferring STI classes,
  # so we must explicitly tell it what serializer to use
  # See: https://github.com/jsonapi-rb/jsonapi-rails/issues/68
  def jsonapi_class
    super.merge(
      'Item::VideoItem': SerializableItem,
      'Item::TextItem': SerializableItem,
      'Item::FileItem': SerializableItem,
      'Item::ExternalImageItem': SerializableItem,
      'Item::LinkItem': SerializableItem,
      'Item::QuestionItem': SerializableItem,
      'Item::ChartItem': SerializableItem,
      'Item::DataItem': SerializableDataItem,
      'Item::LegendItem': SerializableLegendItem,
      'Collection::UserCollection': SerializableCollection,
      'Collection::ApplicationCollection': SerializableCollection,
      'Collection::Board': SerializableCollection,
      'Collection::SharedWithMeCollection': SerializableCollection,
      'Collection::Global': SerializableCollection,
      'Collection::TestCollection': SerializableCollection,
      'Collection::TestDesign': SerializableCollection,
      'Collection::TestOpenResponses': SerializableCollection,
      'Collection::SubmissionBox': SerializableCollection,
      'Collection::SubmissionsCollection': SerializableSubmissionsCollection,
      'Collection::UserProfile': SerializableCollection,
      'CollectionCard::Primary': SerializableCollectionCard,
      'CollectionCard::Link': SerializableCollectionCard,
    )
  end

  # Add items to this hash to make them available
  # as @instance_vars in serializable resources
  def jsonapi_expose
    {
      current_user: current_user,
      current_ability: current_ability,
      current_api_token: current_api_token,
    }
  end

  def json_api_params
    params[:_jsonapi] || {}
  end

  def jsonapi_pagination(collection)
    # check for pagination being enabled
    return unless (current_page = collection.try(:current_page))
    # NOTE: we are not following JSONAPI format, instead
    # just returning the page number rather than absolute URL
    {
      first: 1,
      last: collection.total_pages,
      prev: collection.first_page? ? nil : current_page - 1,
      next: collection.last_page? ? nil : current_page + 1,
    }
  end

  def render_api_errors(errors)
    render jsonapi_errors: errors, status: :unprocessable_entity
  end

  rescue_from CanCan::AccessDenied do |exception|
    render json: { errors: [exception.message] }, status: :unauthorized
  end

  private

  def load_and_filter_index
    # currently the only usage of filtering is for API applications + external_ids,
    # so escape if we are not in that context
    return unless current_application.present?
    # This will return:
    # - 422 error if appropriate
    # - results, which will also get set into the instance variable e.g. @collections
    Controller::FilteredIndexLoader.call(
      controller: self,
      params: params,
      page: @page,
      application: current_application,
    )
  end

  def render_collection(include: nil)
    # include collection_cards for UI to receive any updates
    include ||= Collection.default_relationships_for_api
    render jsonapi: @collection,
           include: include,
           expose: {
             current_record: @collection,
           }
  end

  def check_api_authentication!
    return if user_signed_in? && current_user.active?
    return if current_api_token.present?
    head(:unauthorized)
  end

  def current_ability
    return @current_ability if @current_ability.present?
    if current_api_token.present? &&
       current_api_token.organization_id.present?
      @current_ability = Api::OrganizationAbility.new(current_api_token.organization)
    else
      @current_ability = Ability.new(current_user)
    end
  end

  def current_organization
    @current_organization ||= begin
      current_user.try(:current_organization) ||
        current_api_token.try(:organization) ||
        # e.g. /organizations/1/...
        @organization
    end
  end

  def current_api_token
    return if authorization_token_from_header.blank?
    @current_api_token ||= ApiToken.where(
      token: authorization_token_from_header,
    ).includes(:organization, application: [:user]).first
    if @current_api_token.present? &&
       @current_api_token.application_user.present?
      sign_in(@current_api_token.application_user)
    end
    @current_api_token
  end

  def current_application
    @current_application ||= begin
      @current_api_token&.application ||
        # this second case is more useful in specs (login_as(api_user))
        current_user.application
    end
  end

  def authorization_token_from_header
    return if request.headers['AUTHORIZATION'].blank?
    request.headers['AUTHORIZATION'].sub(/^Bearer\s+/, '')
  end

  def check_cancel_sync
    return unless json_api_params[:data]
    @cancel_sync = json_api_params[:data].delete :cancel_sync
  end

  def check_page_param
    @page = params[:page].try(:to_i) ||
            params[:page].try(:[], :number) ||
            1
  end

  def log_activity?
    current_api_token.blank?
  end
end
