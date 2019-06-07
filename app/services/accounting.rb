class Accounting
  def self.our_commission(_amount)
    0
  end

  # Record that a payment has been made,
  # documenting what we have earned in our 'receivable' account,
  # and what has been taken out due to payment processing fees
  def self.record_payment(payment)
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
  def self.record_payout_owed(survey_response)
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
  def self.record_payout_paid(survey_response)
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

  # Load entry lines for a specific account
  # If you want metadata, you can also .includes(:metadata) on the scope this returns
  def self.lines_for_account(account, code: nil, order: :desc)
    lines = DoubleEntry::Line.where(account: account.identifier)
    lines = lines.where(scope: account.scope_identity) if account.scope_identity.present?
    lines = lines.where(code: code) if code.present?
    lines.order(created_at: order)
  end
end
