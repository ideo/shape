require_dependency "#{Rails.root}/lib/jsonapi_mappings"

class Api::V1::BaseController < ApplicationController
  include ReplaceGlobalTranslationVariables
  before_action :check_api_authentication!
  before_action :check_cancel_sync
  before_action :check_page_param
  before_action :set_locale

  respond_to :json

  rescue_from CanCan::AccessDenied do |exception|
    render json: { errors: [exception.message] }, status: :unauthorized
  end

  rescue_from ActiveRecord::RecordNotFound do |exception|
    render json: { errors: [exception.message] }, status: :not_found
  end

  # See all configuration options for the jsonapi in the jsonapi-rb-rails gem

  # jsonapi-rb has issues inferring STI classes,
  # so we must explicitly tell it what serializer to use
  # See: https://github.com/jsonapi-rb/jsonapi-rails/issues/68
  def jsonapi_class
    super.merge(::JSONAPI_CUSTOM_MAPPINGS)
  end

  # Add items to this hash to make them available
  # as @instance_vars in serializable resources
  def jsonapi_expose
    {
      current_user: current_user || User.new,
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

    total = collection.total_pages
    last_page = total.zero? || collection.last_page?
    # NOTE: we are not following JSONAPI format, instead
    # just returning the page number rather than absolute URL
    {
      first: 1,
      last: total,
      prev: collection.first_page? ? nil : current_page - 1,
      next: last_page ? nil : current_page + 1,
    }
  end

  def render_api_errors(errors)
    render jsonapi_errors: errors, status: :unprocessable_entity
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
    if @collection.is_a?(Collection::SubmissionsCollection)
      include.delete_if do |val|
        # don't include these relationships in the SubmissionsCollection response
        # as they were already included with the SubmissionBox
        val == :parent || val.try(:keys) == [:roles]
      end
    end
    renderer = JSONAPI::Serializable::Renderer.new
    json_data = renderer.render(
      @collection,
      class: jsonapi_class,
      include: include,
      expose: jsonapi_expose.merge(
        current_record: @collection,
      ),
    )
    render json: json_data

    # render jsonapi: @collection,
    #        include: include,
    #        expose: exposables
  end

  def check_api_authentication!
    return if user_signed_in? && current_user.active?
    return if current_api_token.present?

    head(:unauthorized)
  end

  def require_application_bot!
    return if current_user&.application_bot?

    head(:unauthorized)
  end

  def current_ability
    return @current_ability if @current_ability.present?

    if current_api_token.present? &&
       current_api_token.organization_id.present?
      @current_ability = Api::OrganizationAbility.new(current_api_token.organization)
    else
      @current_ability = Ability.new(current_user, current_application)
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
        current_user&.application
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
            params[:filter].try(:[], :page) ||
            1
  end

  def log_activity?
    current_api_token.blank?
  end

  def load_and_authorize_organization_from_slug
    slug = params[:organization_id]
    slug = params[:id] if !slug && controller_name == 'organizations'
    @organization = Organization.friendly.find(slug)
    authorize! :read, @organization
  end

  def set_locale
    if user_signed_in?
      I18n.locale = current_user.locale
    else
      I18n.locale = I18n.default_locale
    end
  end

  def collection_broadcaster(collection = @collection)
    CollectionUpdateBroadcaster.new(collection, current_user)
  end

  def switch_to_organization
    return unless user_signed_in?
    return if @collection.common_viewable?

    current_user.switch_to_organization(@collection.organization)
  end
end
