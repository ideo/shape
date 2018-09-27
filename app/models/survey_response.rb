class SurveyResponse < ApplicationRecord
  belongs_to :test_collection, class_name: 'Collection::TestCollection'
  has_many :question_answers, dependent: :destroy

  delegate :question_items, to: :test_collection

  enum status: {
    in_progress: 0,
    completed: 1,
  }

  def all_questions_answered?
    question_items.pluck(:id).sort == question_answers.pluck(:question_id).sort
  end

  def question_answer_created_or_destroyed
    self.status = all_questions_answered? ? :completed : :in_progress
    self.updated_at = Time.current
    save
  end
end
