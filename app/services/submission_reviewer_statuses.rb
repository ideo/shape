class SubmissionReviewerStatuses
  include Interactor

  # This assumes submissions have the tagged_users relationship eager-loaded for performance
  delegate_to_context :challenge, :submissions, :data

  before do
    context.data = []
  end

  def call
    return if submissions.blank? || challenge.blank?

    submissions.each do |submission|
      next unless submission.present?

      test_id = submission.launchable_test_id

      next unless test_id.present?

      submission.tagged_users.each do |user|
        next unless user.present?

        data.push(
          user_id: user.id,
          status: status_for_test_user(test_id: test_id, user_id: user.id),
          record_id: submission.id,
        )
      end
    end
  end

  private

  def status_for_test_user(test_id:, user_id:)
    survey_response = survey_responses_by_test_id[test_id]&.find do |sr|
      sr.user_id == user_id
    end

    if survey_response.blank?
      :unstarted
    elsif survey_response.completed?
      :completed
    else
      :in_progress
    end
  end

  def survey_responses_by_test_id
    @survey_responses_by_test_id ||= SurveyResponse.where(
      test_collection_id: test_ids,
      user_id: reviewer_ids,
    ).each_with_object({}) do |sr, h|
      h[sr.test_collection_id] ||= []
      h[sr.test_collection_id] << sr
    end
  end

  def reviewer_ids
    submissions.map(&:tagged_users).flatten.map(&:id).uniq
  end

  def test_ids
    submissions.map do |submission|
      submission.submission_attrs['launchable_test_id']
    end
  end
end
