class TestAudience < ApplicationRecord
  belongs_to :audience
  belongs_to :test_collection,
             class_name: 'Collection::TestCollection'
  has_many :survey_responses

  def closed?
    survey_responses.completed.size >= sample_size
  end
end
