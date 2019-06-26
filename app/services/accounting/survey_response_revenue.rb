module Accounting
  class SurveyResponseRevenue
    def initialize(survey_response)
      @survey_response = survey_response
    end

    def incentive
      @survey_response.amount_earned
    end

    def paypal_fee
      Accounting::RecordTransfer.paypal_fee(incentive)
    end

    def payment
      @payment ||= @survey_response.test_audience.payment
    end

    def sample_size
      @sample_size ||= @survey_response.test_audience.sample_size
    end

    def received_payment_per_response
      # how much (after the fee) did they end up paying us for this individual response
      (payment.amount_without_stripe_fee / sample_size).round(2)
    end

    def rounding_difference
      # consider the rounding difference, include it in the first revenue calculation for this payment
      # NOTE: difference may be negative
      (payment.amount_without_stripe_fee - (received_payment_per_response * sample_size)).round(2)
    end

    def revenue
      meta = DoubleEntry::LineMetadata.arel_table
      recorded_revenue = DoubleEntry::Line
                         .joins(:metadata)
                         .where(account: :revenue)
                         .where(meta[:key].eq(:survey_response_id))
                         .where(meta[:value].eq(@survey_response.id))
                         .first

      if recorded_revenue.present?
        # if we already recorded revenue for this survey_response, just look that up
        @revenue = BigDecimal(recorded_revenue.amount.to_s)
        return @revenue
      end

      # otherwise calculate how much revenue we should record
      @revenue = received_payment_per_response - incentive - paypal_fee
      # consider the rounding difference, include it in the first revenue calculation for this payment
      first_payment = DoubleEntry.account(:revenue, scope: payment).balance.zero?
      @revenue += rounding_difference if first_payment
      @revenue
    end
  end
end
