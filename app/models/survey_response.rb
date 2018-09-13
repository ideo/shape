class SurveyResponse < ApplicationRecord
  belongs_to :test_collection, class_name: 'Collection::TestCollection'
  has_many :question_answers, dependent: :destroy
end
