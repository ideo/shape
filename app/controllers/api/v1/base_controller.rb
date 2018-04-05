class Api::V1::BaseController < ApplicationController
  before_action :authenticate_user!
  respond_to :json

  # See all configuration options for the jsonapi in the jsonapi-rb-rails gem

  # jsonapi-rb has issues inferring STI classes,
  # so we must explicitly tell it what serializer to use
  # See: https://github.com/jsonapi-rb/jsonapi-rails/issues/68
  def jsonapi_class
    super.merge(
      'Item::VideoItem': SerializableItem,
      'Item::ImageItem': SerializableItem,
      'Item::TextItem': SerializableItem,
      'Collection::UserCollection': SerializableCollection,
      'Collection::SharedWithMeCollection': SerializableCollection,
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
    }
  end

  def json_api_params
    params[:_jsonapi]
  end

  def render_api_errors(errors)
    render jsonapi_errors: errors, status: :bad_request
  end

  rescue_from CanCan::AccessDenied do |exception|
    render json: { errors: [exception.message] }, status: :unauthorized
  end

  private

  def current_organization
    @current_organization ||= current_user.try(:current_organization)
  end
end
