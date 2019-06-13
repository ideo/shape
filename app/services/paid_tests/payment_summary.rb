module PaidTests
  class PaymentSummary

    def initialize(payment:, start_time:, end_time:)
      @payment = payment
      @start_time = start_time
      @end_time = end_time
    end

    def total_revenue
      revenue_deferred + revenue
    end

    def revenue_deferred
      DoubleEntry::BalanceCalculator.calculate(
        DoubleEntry.account(:revenue_deferred, scope: @payment),
        from: @start_time,
        to: @end_time,
        code: :purchase,
      )
    end

    def revenue
      DoubleEntry::BalanceCalculator.calculate(
        DoubleEntry.account(:revenue, scope: @payment),
        from: @start_time,
        to: @end_time,
        codes: %i[revenue unclaimed_incentive],
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
