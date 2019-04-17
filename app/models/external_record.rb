class ExternalRecord < ApplicationRecord
  belongs_to :application
  # `optional` mostly to allow building records e.g. when creating along with a group
  belongs_to :externalizable, polymorphic: true, optional: true

  amoeba do
    enable
  end
end
