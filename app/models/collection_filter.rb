# == Schema Information
#
# Table name: collection_filters
#
#  id            :bigint(8)        not null, primary key
#  filter_type   :integer
#  text          :string
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  collection_id :bigint(8)
#
# Indexes
#
#  index_collection_filters_on_collection_id  (collection_id)
#

class CollectionFilter < ApplicationRecord
  belongs_to :collection
  # TODO should we destroy the user filters in a worker? they will never
  # show up in the UI after their collection_filter is destroyed
  has_many :user_collection_filters,
           dependent: :destroy

  enum filter_type: {
    tag: 0,
    search: 1,
  }

  # TODO look up these values as I forgot what they all mean
  amoeba do
    enable
    recognize []
    propagate
  end
end
