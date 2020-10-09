module SerializedExternalId
  extend ActiveSupport::Concern

  included do
    attribute :external_id, if: -> { @current_application } do
      @object.external_records.find_by(application_id: @current_application.id).try(:external_id)
    end
  end
end
