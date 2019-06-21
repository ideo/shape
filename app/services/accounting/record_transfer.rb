module Accounting
  class RecordTransfer
    def self.paypal_fee(amount)
      (amount * BigDecimal('0.05')).round(2)
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
        metadata: { survey_response_id: survey_response.id },
      )
    end

    # Record that we have paid out to an individual,
    # transferring from their individual_owed to their individual_paid account
    def self.incentive_paid(survey_response)
      incentive = survey_response.amount_earned
      paypal_fee = paypal_fee(incentive)
      payment = survey_response.test_audience.payment
      user = survey_response.user

      # calculate revenue:
      sample_size = survey_response.test_audience.sample_size
      # how much (after the fee) did they end up paying us for this individual response
      received_payment_per_response = (payment.amount_without_stripe_fee / sample_size).round(2)
      revenue = received_payment_per_response - incentive - paypal_fee

      # consider the rounding difference, include it in the first revenue calculation for this payment
      rounding_difference = (payment.amount_without_stripe_fee - (received_payment_per_response * sample_size)).round(2)
      revenue_collected = DoubleEntry.account(:revenue, scope: payment).balance
      if rounding_difference && revenue_collected.zero?
        # NOTE: difference may be negative
        revenue += rounding_difference
      end

      DoubleEntry.transfer(
        Money.new(incentive * 100),
        from: DoubleEntry.account(:individual_owed, scope: user),
        to: DoubleEntry.account(:individual_paid, scope: user),
        code: :incentive_paid,
        metadata: { survey_response_id: survey_response.id },
      )

      # We absorb the Paypal fee, so it comes out of our revenue
      DoubleEntry.transfer(
        Money.new(paypal_fee * 100),
        from: DoubleEntry.account(:revenue_deferred, scope: payment),
        to: DoubleEntry.account(:payment_processor, scope: payment),
        code: :paypal_fee,
        metadata: { survey_response_id: survey_response.id },
      )

      return if revenue <= 0

      DoubleEntry.transfer(
        Money.new(revenue * 100),
        from: DoubleEntry.account(:revenue_deferred, scope: payment),
        to: DoubleEntry.account(:revenue, scope: payment),
        code: :revenue,
        metadata: { survey_response_id: survey_response.id },
      )
    end
  end
end
