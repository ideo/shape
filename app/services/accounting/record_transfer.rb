module Accounting
  class RecordTransfer
    def self.paypal_fee(amount)
      (amount * BigDecimal('0.05')).round(2)
    end

    def self.stripe_fee(amount)
      ((amount * BigDecimal('0.029')) + BigDecimal('0.3')).round(2)
    end

    # Record that a payment has been made,
    # documenting what we have earned in our 'receivable' account,
    # and what has been taken out due to payment processing fees
    def self.payment_received(payment)
      DoubleEntry.transfer(
        Money.new(payment.amount_without_stripe_fee * 100),
        from: DoubleEntry.account(:cash, scope: payment),
        to: DoubleEntry.account(:revenue_deferred, scope: payment),
        code: :purchase,
      )
      DoubleEntry.transfer(
        Money.new(payment.stripe_fee * 100),
        from: DoubleEntry.account(:cash, scope: payment),
        to: DoubleEntry.account(:payment_processor, scope: payment),
        code: :stripe_fee,
      )
    end

    # Record that we owe a survey responder an incentive
    # to increase their own individual owed balance
    def self.incentive_owed(survey_response)
      user = survey_response.user
      amount = survey_response.amount_earned
      payment = survey_response.test_audience.payment

      DoubleEntry.transfer(
        Money.new(amount * 100),
        from: DoubleEntry.account(:revenue_deferred, scope: payment),
        to: DoubleEntry.account(:individual_owed, scope: user),
        code: :incentive_owed,
        detail: payment,
        metadata: { survey_response_id: survey_response.id },
      )
    end

    # Record that we have paid out to an individual,
    # transferring from their individual_owed to their individual_paid account
    def self.incentive_paid(survey_response)
      calculator = Accounting::SurveyResponseRevenue.new(survey_response)
      user = survey_response.user
      payment = calculator.payment

      DoubleEntry.transfer(
        Money.new(calculator.incentive * 100),
        from: DoubleEntry.account(:individual_owed, scope: user),
        to: DoubleEntry.account(:individual_paid, scope: user),
        detail: payment,
        code: :incentive_paid,
        metadata: { survey_response_id: survey_response.id },
      )

      # We absorb the Paypal fee, so it comes out of our revenue
      DoubleEntry.transfer(
        Money.new(calculator.paypal_fee * 100),
        from: DoubleEntry.account(:revenue_deferred, scope: payment),
        to: DoubleEntry.account(:payment_processor, scope: payment),
        code: :paypal_fee,
        metadata: { survey_response_id: survey_response.id },
      )

      return if calculator.revenue <= 0

      DoubleEntry.transfer(
        Money.new(calculator.revenue * 100),
        from: DoubleEntry.account(:revenue_deferred, scope: payment),
        to: DoubleEntry.account(:revenue, scope: payment),
        code: :revenue,
        metadata: { survey_response_id: survey_response.id },
      )
    end
  end
end
