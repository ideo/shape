# == Schema Information
#
# Table name: user_collection_filters
#
#  id                   :bigint(8)        not null, primary key
#  selected             :boolean          default(TRUE)
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#  collection_filter_id :bigint(8)
#  user_id              :bigint(8)
#

class UserCollectionFilter < ApplicationRecord
  belongs_to :collection_filter
  belongs_to :user

  has_one :collection,
          through: :collection_filter
end
