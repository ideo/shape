# == Schema Information
#
# Table name: votes
#
#  id           :bigint(8)        not null, primary key
#  votable_type :string
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  user_id      :bigint(8)
#  votable_id   :bigint(8)
#
# Indexes
#
#  index_votes_on_votable_type_and_votable_id_and_user_id  (votable_type,votable_id,user_id) UNIQUE
#

class Vote < ApplicationRecord
  belongs_to :votable, polymorphic: true, required: true
  belongs_to :user, required: true
end
