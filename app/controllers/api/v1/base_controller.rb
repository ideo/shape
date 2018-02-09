class Api::V1::BaseController < ApplicationController
  before_action :authenticate_user!
  respond_to :json

  # jsonapi-rb has issues inferring STI classes,
  # so we must explicitly what serializer to use
  # See: https://github.com/jsonapi-rb/jsonapi-rails/issues/68
  def jsonapi_class
    super.merge(
      'Item::TextItem': SerializableItem
    )
  end

  private

  def current_organization
    @current_organization ||= current_user.try(:current_organization)
  end
end
