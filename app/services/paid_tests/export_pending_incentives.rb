module PaidTests
  class ExportPendingIncentives < SimpleService
    def initialize(survey_response_ids: nil)
      # allows you to regenerate this report calling the same survey_response_ids
      @survey_response_ids = survey_response_ids
    end

    def call
      async_mark_as_paid!
      generate_csv
    end

    def generate_csv
      CSV.generate do |csv|
        csv << csv_header
        pending_incentive_users.each do |user|
          responses = begin
            survey_responses_owed
              .where(user: user)
              .includes(:test_collection, test_audience: :audience)
          end
          earned = responses.map(&:incentive_paid_amount).sum
          test_names = responses.map { |r| r.test_collection&.name }
          audience_names = responses.map { |r| r.test_audience&.name }
          csv << [
            user.uid,
            user.name,
            user.email,
            user.phone,
            format('%.2f', earned),
            test_names.join(', '),
            audience_names.join(', '),
            responses.map(&:incentive_owed_at).join(', '),
          ]
        end
      end
    end

    private

    def async_mark_as_paid!
      survey_responses_owed.pluck(:id).each do |id|
        RecordPaidSurveyResponseWorker.perform_async(id)
      end
    end

    def csv_header
      [
        'User ID',
        'Name',
        'Email',
        'Phone',
        'Amount Owed',
        'Test Collection(s)',
        'Test Audience(s)',
        'Completed/Owed At',
      ]
    end

    def survey_responses_owed
      # capture these to make sure we're working with a consistent dataset
      @survey_response_ids ||= SurveyResponse.incentive_owed.pluck(:id)
      @survey_responses_owed ||= SurveyResponse.where(id: @survey_response_ids)
    end

    def pending_incentive_users
      survey_responses_owed
        .group(:user_id, :id)
        .includes(:user)
        .map(&:user)
    end
  end
end
