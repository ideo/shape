# == Schema Information
#
# Table name: question_choices
#
#  id               :bigint(8)        not null, primary key
#  archived         :boolean
#  order            :integer
#  text             :text
#  value            :integer
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  question_item_id :integer
#

class QuestionChoice < ApplicationRecord
  belongs_to :question,
             class_name: 'Item::QuestionItem',
             foreign_key: 'question_item_id',
             # because we build duplicate question_choices along with a question_item
             # turning off `optional` allows that to validate properly
             optional: true

  delegate :can_edit?,
           :can_view?,
           to: :question

  scope :viewable_in_ui, -> { where(archived: nil) }

  def duplicate!(assign_question: question)
    qc = amoeba_dup
    qc.question = assign_question
    qc.save
    qc
  end
end
