module Accounting
  class RecordTransfer
    def self.paypal_fee(amount)
      (amount * 0.05).round(2)
    end

    def self.our_commission(_amount)
      0
    end

    # Record that a payment has been made,
    # documenting what we have earned in our 'receivable' account,
    # and what has been taken out due to payment processing fees
    def self.payment_received(payment)
      DoubleEntry.transfer(
        Money.new(payment.amount_without_stripe_fee * 100),
        from: DoubleEntry.account(:cash),
        to: DoubleEntry.account(:receivable),
        code: :purchase,
        metadata: { payment_id: payment.id },
      )
      DoubleEntry.transfer(
        Money.new(payment.stripe_fee * 100),
        from: DoubleEntry.account(:cash),
        to: DoubleEntry.account(:payment_processor),
        code: :stripe_fee,
        metadata: { payment_id: payment.id },
      )
    end

    # Record that we owe a survey responder an incentive
    # to increase their own individual owed balance
    def self.incentive_owed(survey_response)
      user = survey_response.user
      amount = survey_response.amount_earned

      DoubleEntry.transfer(
        Money.new(amount * 100),
        from: DoubleEntry.account(:receivable),
        to: DoubleEntry.account(:individual_owed, scope: user),
        code: :incentive_owed,
        metadata: { survey_response_id: survey_response.id },
      )
    end

    # Record that we have paid out to an individual,
    # transferring from their individual_owed to their individual_paid account
    def self.incentive_paid(survey_response)
      user = survey_response.user
      amount = survey_response.amount_earned
      paypal_fee = paypal_fee(amount)
      commission = our_commission(amount)

      DoubleEntry.transfer(
        Money.new(amount * 100),
        from: DoubleEntry.account(:individual_owed, scope: user),
        to: DoubleEntry.account(:individual_paid, scope: user),
        code: :incentive_paid,
        metadata: { survey_response_id: survey_response.id },
      )

      # We absorb the Paypal fee, so it comes out of our receivable account
      DoubleEntry.transfer(
        Money.new(paypal_fee * 100),
        from: DoubleEntry.account(:receivable),
        to: DoubleEntry.account(:payment_processor),
        code: :paypal_fee,
        metadata: { survey_response_id: survey_response.id },
      )

      return if commission <= 0

      DoubleEntry.transfer(
        Money.new(commission * 100),
        from: DoubleEntry.account(:receivable),
        to: DoubleEntry.account(:revenue),
        code: :commission,
        metadata: { survey_response_id: survey_response.id },
      )
    end
  end
end
