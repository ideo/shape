class TestAudience < ApplicationRecord
  belongs_to :audience
  belongs_to :test_collection,
             class_name: 'Collection::TestCollection'
  has_many :survey_responses

  delegate :name, :price_per_response,
           to: :audience,
           prefix: true
end
