module Externalizable
  extend ActiveSupport::Concern

  included do
    has_many :external_records, as: :externalizable, dependent: :destroy
  end

  class_methods do
    def where_external_id(external_id, application_id:)
      joins(:external_records)
        .where(ExternalRecord.arel_table[:external_id].in(external_id))
        .where(ExternalRecord.arel_table[:application_id].eq(application_id))
    end
  end
end
