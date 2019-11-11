# == Schema Information
#
# Table name: question_answer_choices
#
#  id                 :bigint(8)        not null, primary key
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  question_answer_id :integer
#  question_choice_id :integer
#

class QuestionAnswerChoice < ApplicationRecord
  belongs_to :question_answer
  belongs_to :question_choice
end
