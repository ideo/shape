class Api::V1::BaseController < ApplicationController
  before_action :authenticate_user!
  respond_to :json

  # jsonapi-rb has issues inferring STI classes,
  # so we must explicitly what serializer to use
  # See: https://github.com/jsonapi-rb/jsonapi-rails/issues/68
  def jsonapi_class
    super.merge(
      'Item::TextItem': SerializableItem,
      'Collection::UserCollection': SerializableCollection,
      'Collection::SharedWithMeCollection': SerializableCollection
    )
  end

  # See all configuration options in the jsonapi-rb-rails gem
  def jsonapi_expose
    {
      current_user: current_user
    }
  end

  private

  def current_organization
    @current_organization ||= current_user.try(:current_organization)
  end
end
