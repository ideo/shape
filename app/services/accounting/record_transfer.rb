module Accounting
  class RecordTransfer
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
        code: :transaction_fee,
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
        code: :payout_owed,
        metadata: { survey_response_id: survey_response.id },
      )
    end

    # Record that we have paid out to an individual,
    # transferring from their individual_owed to their individual_paid account
    def self.incentive_paid(survey_response)
      user = survey_response.user
      amount = survey_response.amount_earned
      commission = our_commission(amount)

      DoubleEntry.transfer(
        Money.new(amount * 100),
        from: DoubleEntry.account(:individual_owed, scope: user),
        to: DoubleEntry.account(:individual_paid, scope: user),
        code: :payout,
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
