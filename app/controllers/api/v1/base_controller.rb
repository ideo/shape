class Api::V1::BaseController < ApplicationController
  before_action :check_api_authentication!
  before_action :check_cancel_sync

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
      'Item::LinkItem': SerializableItem,
      'Item::QuestionItem': SerializableItem,
      'Item::ChartItem': SerializableItem,
      'Item::DataItem': SerializableDataItem,
      'Collection::UserCollection': SerializableCollection,
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
    render jsonapi_errors: errors, status: :bad_request # or :unprocessable_entity?
  end

  rescue_from CanCan::AccessDenied do |exception|
    render json: { errors: [exception.message] }, status: :unauthorized
  end

  private

  # items/collections don't have an unfiltered index, so filtering is required
  def require_and_apply_filters
    @filter = params[:filter] || {}
    # this is the only applicable filter for now
    head(400) unless @filter[:external_id].present?
    apply_filters
  end

  def apply_filters
    @filter = params[:filter] || {}
    @page = params[:page].try(:[], :number) || 1
    return unless @filter.present?
    # this is the only applicable filter for now
    return unless @filter[:external_id].present?
    controller_name = params[:controller].split('/').last
    klass = controller_name.classify.safe_constantize
    application = @current_api_token&.application || current_user.application
    head(400) unless application.present?
    records = klass.where_external_id(
      @filter[:external_id],
      application_id: application.id,
    ).page(@page)
    instance_variable_set(
      "@#{controller_name}", records
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
    head(401)
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
    @current_organization ||= current_user.try(:current_organization) ||
                              current_api_token.try(:organization)
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

  def authorization_token_from_header
    return if request.headers['AUTHORIZATION'].blank?
    request.headers['AUTHORIZATION'].sub(/^Bearer\s+/, '')
  end

  def check_cancel_sync
    return unless json_api_params[:data]
    @cancel_sync = json_api_params[:data].delete :cancel_sync
  end
end
