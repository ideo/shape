# == Schema Information
#
# Table name: survey_responses
#
#  id                 :bigint(8)        not null, primary key
#  incentive_owed_at  :datetime
#  incentive_paid_at  :datetime
#  incentive_status   :integer
#  session_uid        :text
#  status             :integer          default("in_progress")
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  test_audience_id   :bigint(8)
#  test_collection_id :bigint(8)
#  user_id            :bigint(8)
#
# Indexes
#
#  index_survey_responses_on_incentive_status    (incentive_status)
#  index_survey_responses_on_session_uid         (session_uid) UNIQUE
#  index_survey_responses_on_test_audience_id    (test_audience_id)
#  index_survey_responses_on_test_collection_id  (test_collection_id)
#  index_survey_responses_on_user_id             (user_id)
#

class SurveyResponse < ApplicationRecord
  belongs_to :test_collection, class_name: 'Collection::TestCollection', touch: true
  belongs_to :user, optional: true
  belongs_to :test_audience, optional: true
  has_many :question_answers, dependent: :destroy
  # Deprecating this - storing status on this record and in accounting double entry records
  has_one :feedback_incentive_record

  before_create :set_default_incentive_status, if: :gives_incentive?
  before_save :mark_as_completed, if: :mark_as_completed?

  delegate :question_items, :answerable_complete_question_items,
           to: :test_collection

  delegate :price_per_response,
           to: :test_audience,
           allow_nil: true

  delegate :incentive_owed_account_balance,
           :incentive_paid_account_balance,
           to: :user,
           allow_nil: true

  enum status: {
    in_progress: 0,
    completed: 1,
    completed_late: 2,
  }

  enum incentive_status: {
    incentive_unearned: 0,
    incentive_owed: 1,
    incentive_paid: 2,
  }

  def record_incentive_owed!
    return if !incentive_unearned? || amount_earned.zero? || user.blank?
    Accounting::RecordTransfer.incentive_owed(self)
    update(incentive_status: :incentive_owed, incentive_owed_at: Time.current)
    incentive_owed_account_balance
  end

  def record_incentive_paid!
    return if !incentive_owed? || amount_earned.zero? || !incentive_owed_account_balance.positive?
    Accounting::RecordTransfer.incentive_paid(self)
    update(incentive_status: :incentive_paid, incentive_paid_at: Time.current)
    incentive_paid_account_balance
  end

  def amount_earned
    return 0 if !completed? || !gives_incentive?
    TestAudience.incentive_amount
  end

  def all_questions_answered?
    # nil case should only happen in test env (test_design is not created)
    return false if answerable_complete_question_items.nil?
    # compare answerable question items to the ones we've answered
    (answerable_complete_question_items.pluck(:id) - question_answers.pluck(:question_id)).empty?
  end

  def question_answer_created_or_destroyed
    if all_questions_answered?
      SurveyResponseCompletion.call(self)
    else
      update(updated_at: Time.current)
    end
  end

  def cache_test_scores!
    return unless test_collection.inside_a_submission?
    test_collection.parent_submission.cache_test_scores!
  end

  def gives_incentive?
    test_audience&.paid? ? true : false
  end

  private

  def set_default_incentive_status
    self.incentive_status ||= :incentive_unearned
  end

  def mark_as_completed?
    in_progress? && all_questions_answered?
  end

  def mark_as_completed
    self.status = if test_collection.live?
                    :completed
                  else
                    :completed_late
                  end
  end

  def create_open_response_items
    question_answers
      .joins(:question)
      .includes(:open_response_item)
      .where(
        Item::QuestionItem
          .arel_table[:question_type]
          .eq(Item::QuestionItem.question_types[:question_open]),
      ).each do |question_answer|
        next if question_answer.open_response_item.present?
        # Save will trigger the callback to create the item
        question_answer.save
      end
  end
end
