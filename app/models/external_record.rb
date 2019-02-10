class ExternalRecord < ApplicationRecord
  belongs_to :application
  belongs_to :externalizable, polymorphic: true

  # e.g. Application 1 can only mark one "Item" as external_id: 2
  validates :external_id,
            uniqueness: { scope: %i[application_id externalizable_type] }
end
