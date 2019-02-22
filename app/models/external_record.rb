class ExternalRecord < ApplicationRecord
  belongs_to :application
  # `optional` mostly to allow building records e.g. when creating along with a group
  belongs_to :externalizable, polymorphic: true, optional: true

  # e.g. Application 1 can only mark one "Item" as external_id: 2
  validates :external_id,
            uniqueness: { scope: %i[application_id externalizable_type] }
end
