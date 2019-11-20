# == Schema Information
#
# Table name: survey_responses
#
#  id                 :bigint(8)        not null, primary key
#  incentive_owed_at  :datetime
#  incentive_paid_at  :datetime
#  incentive_status   :integer
#  respondent_alias   :string
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
  has_one :test_results_collection, class_name: 'Collection::TestResultsCollection'
  # Deprecating this - storing status on this record and in accounting double entry records
  has_one :feedback_incentive_record

  before_create :set_default_incentive_status, if: :gives_incentive?
  after_create :create_alias

  delegate :question_items,
           to: :test_collection

  delegate :price_per_response, :audience,
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
    duplicate: 3,
  }

  enum incentive_status: {
    incentive_unearned: 0,
    incentive_owed: 1,
    incentive_paid: 2,
  }

  def dataset_display_name
    respondent_alias
  end

  def record_incentive_owed!
    return if !incentive_unearned? || amount_earned.zero? || user&.email.blank?

    # TODO: what if a user (phone only?) fills out their email later to be "owed" for a previous response?
    update(incentive_status: :incentive_owed, incentive_owed_at: Time.current)
    Accounting::RecordTransfer.incentive_owed(self)
    incentive_owed_account_balance
  end

  def record_incentive_paid!
    return if !incentive_owed? || amount_earned.zero? || !incentive_owed_account_balance.positive?

    update(incentive_status: :incentive_paid, incentive_paid_at: Time.current)
    Accounting::RecordTransfer.incentive_paid(self)
    incentive_paid_account_balance
  end

  def potential_incentive
    return 0 unless gives_incentive?

    audience.incentive_per_response(test_collection.paid_question_items.size)
  end

  def amount_earned
    completed? ? potential_incentive : 0
  end

  def question_answer_created_or_destroyed
    touch
    # service will validate that all questions have been answered
    return unless SurveyResponseValidation.call(self)

    SurveyResponseCompletion.call(self)
  end

  def cache_test_scores!
    return unless test_collection.inside_a_submission?

    test_collection.parent_submission.cache_test_scores!
  end

  def gives_incentive?
    test_audience&.paid? ? true : false
  end

  def create_alias
    return if respondent_alias.present?

    survey_names = test_collection.survey_responses.pluck(:respondent_alias)
    survey_names << user&.first_name

    name = UniqNameGenerator.call(disallowed_names: survey_names.compact)
    update_attributes(respondent_alias: name)
  end

  private

  def set_default_incentive_status
    self.incentive_status ||= :incentive_unearned
  end
end
