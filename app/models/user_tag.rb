# == Schema Information
#
# Table name: user_tags
#
#  id          :bigint(8)        not null, primary key
#  record_type :string
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  record_id   :bigint(8)
#  user_id     :bigint(8)
#
# Indexes
#
#  index_user_tags_on_user_id_and_record_id_and_record_type  (user_id,record_id,record_type) UNIQUE
#

class UserTag < ApplicationRecord
  belongs_to :user
  belongs_to :record, polymorphic: true
end
