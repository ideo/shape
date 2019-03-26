module Externalizable
  extend ActiveSupport::Concern

  included do
    has_many :external_records, as: :externalizable, dependent: :destroy
    attr_accessor :external_id
  end

  class_methods do
    def where_external_id(external_id, application_id:)
      joins(:external_records)
        .where(ExternalRecord.arel_table[:external_id].in(external_id))
        .where(ExternalRecord.arel_table[:application_id].eq(application_id))
    end
  end

  def add_external_id(external_id, application_id)
    return true if external_records.create(
      external_id: external_id,
      application_id: application_id,
    )
    errors.add(:external_id, 'must be unique')
    raise ActiveRecord::Rollback
  end

  def duplicate_external_records(externalizable)
    external_records.map do |external_record|
      dupe = external_record.amoeba_dup
      dupe.externalizable = externalizable
      dupe.save!
      dupe
    end
  end
end
