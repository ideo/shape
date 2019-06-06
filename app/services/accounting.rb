class Accounting
  def self.stripe_fee(total)
    (total - 0.029) + 0.30
  end

  def self.our_commission(_amount)
    0
  end

  def self.record_payment(payment:, test_audience:)
    DoubleEntry.transfer(
      Money.new(payment.amount),
      from: DoubleEntry.account(:cash, scope_identifier: payment),
      to: DoubleEntry.account(:receivable, scope_identifier: payment),
      code: :purchase,
    )
    DoubleEntry.transfer(
      Money.new(stripe_fee(payment.amount)),
      from: DoubleEntry.account(:receivable, scope_identifier: payment),
      to: DoubleEntry.account(:payment_processor, scope_identifier: test_audience),
      code: :transaction_fee,
    )
  end

  # See SurveyResponseCompletion - app/services/survey_response_completion.rb
  # and FeedbackIncentiveRecord
  # How do we actually want to track it?
  def self.record_payout(payment:, user:, amount:)
    DoubleEntry.transfer(
      Money.new(amount),
      from: DoubleEntry.account(:receivable, scope_identifier: payment),
      to: DoubleEntry.account(:individual, scope_identifier: user),
      code: :payout,
    )

    commission = our_commission(amount)
    return if commission <= 0

    DoubleEntry.transfer(
      Money.new(our_commission(amount)),
      from: DoubleEntry.account(:receivable, scope_identifier: payment),
      to: DoubleEntry.account(:revenue, scope_identifier: payment),
      code: :payout,
    )
  end
end
