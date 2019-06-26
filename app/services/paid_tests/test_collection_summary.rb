module PaidTests
  class TestCollectionSummary

    def initialize(test_collection:, start_time:, end_time:)
      @test_collection = test_collection
      @start_time = start_time
      @end_time = end_time
    end

    def amount_owed
      # Amount owed is the total amount not yet paid out
      paid_survey_responses.where(
        incentive_owed_at: @start_time..@end_time,
      ).where(
        arel_paid_at.eq(nil)
        .or(
          arel_paid_at.gt(@end_time),
        )
      ).sum(&:amount_earned)
    end

    def amount_paid
      paid_survey_responses.where(
        incentive_paid_at: @start_time..@end_time,
      ).sum(&:amount_earned)
    end

    private

    def arel_paid_at
      SurveyResponse.arel_table[:incentive_paid_at]
    end

    def paid_survey_responses
      @paid_survey_responses ||= @test_collection
        .survey_responses
        .joins(:test_audience)
        .includes(:test_audience)
        .merge(
          TestAudience.paid
        )
    end
  end
end
