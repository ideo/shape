# == Schema Information
#
# Table name: test_audiences
#
#  id                 :bigint(8)        not null, primary key
#  sample_size        :integer
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  audience_id        :bigint(8)
#  test_collection_id :bigint(8)
#
# Indexes
#
#  index_test_audiences_on_audience_id         (audience_id)
#  index_test_audiences_on_test_collection_id  (test_collection_id)
#
# Foreign Keys
#
#  fk_rails_...  (audience_id => audiences.id)
#

class TestAudience < ApplicationRecord
  belongs_to :audience
  belongs_to :test_collection,
             class_name: 'Collection::TestCollection'
  has_many :survey_responses
end
