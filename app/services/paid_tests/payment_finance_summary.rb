module PaidTests
  class PaymentFinanceSummary

    def initialize(payment:, start_time:, end_time:)
      @payment = payment
      @start_time = start_time
      @end_time = end_time
    end

    def revenue
      balance = DoubleEntry::BalanceCalculator.calculate(
        DoubleEntry.account(:revenue_deferred, scope: @payment),
        from: @start_time,
        to: @end_time,
        code: :purchase,
      )
      balance + DoubleEntry::BalanceCalculator.calculate(
        DoubleEntry.account(:revenue, scope: @payment),
        from: @start_time,
        to: @end_time,
        codes: %i[revenue unclaimed_incentive],
      )
    end

    def amount_owed
      # Amount owed is the total amount not yet paid out
      debugger
      DoubleEntry::BalanceCalculator.calculate(
        DoubleEntry.account(:individual_owed, scope: user),
        from: @start_time,
        to: @end_time,
        code: :incentive_owed,
      )
    end

    def amount_paid
      debugger
      DoubleEntry::BalanceCalculator.calculate(
        DoubleEntry.account(:individual_paid, scope: user),
        from: @start_time,
        to: @end_time,
        code: :incentive_paid,
      )
    end

    def payment_processor_fees
      DoubleEntry::BalanceCalculator.calculate(
        DoubleEntry.account(:payment_processor, scope: @payment),
        from: @start_time,
        to: @end_time,
        codes: %i[stripe_fee paypal_fee],
      )
    end
  end
end
