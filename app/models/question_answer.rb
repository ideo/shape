class QuestionAnswer < ApplicationRecord
  belongs_to :survey_response
  belongs_to :question, class_name: 'Item::QuestionItem'
end
