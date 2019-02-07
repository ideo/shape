class ExternalRecord < ApplicationRecord
  belongs_to :application
  belongs_to :externalizable, polymorphic: true
end
