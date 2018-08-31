class Question < ApplicationRecord
  belongs_to :test_collection, class_name: 'Collection::TestCollection'
  has_many :question_answers

  # some enum of question_types...
end
