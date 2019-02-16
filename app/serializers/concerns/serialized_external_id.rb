module SerializedExternalId
  extend ActiveSupport::Concern

  included do
    attribute :external_id, if: -> { @current_api_token && @current_api_token.application } do
      @object.external_records.find_by(application_id: @current_api_token.application_id).try(:external_id)
    end
  end
end
