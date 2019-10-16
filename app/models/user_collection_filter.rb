class UserCollectionFilter < ApplicationRecord
  belongs_to :collection_filter
  belongs_to :user

  has_one :collection,
          through: :collection_filter
end
