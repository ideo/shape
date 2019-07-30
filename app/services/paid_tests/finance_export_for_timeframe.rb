module PaidTests
  class FinanceExportForTimeframe < SimpleService
    def initialize(start_time:, end_time:)
      @start_time = start_time
      @end_time = end_time
    end

    def call
      CSV.generate do |csv|
        csv << self.class.csv_header
        paid_test_collections.each do |test_collection|
          csv << csv_line_for_test_collection(test_collection)
        end
      end
    end

    def self.months_with_purchases
      return [] if Payment.count.zero?
      first_month = Payment.order(created_at: :asc).first.created_at.beginning_of_month.to_date
      last_month = Payment.order(created_at: :desc).first.created_at.end_of_month.to_date
      months = []
      (first_month..last_month).each do |date|
        next unless date.day == 1
        months << date.strftime('%B %Y')
      end
      months
    end

    def self.csv_header
      [
        'Test Collection ID',
        'Test Name',
        'Revenue',
        'Amount Owed',
        'Amount Paid',
        'Payment Processing Fees',
        'Net Profit',
      ]
    end

    private

    def csv_line_for_test_collection(test_collection)
      payment_summaries = payment_summaries_for_test_collection(test_collection)
      revenue = payment_summaries.sum(&:amount)
      payment_processor_fees = payment_summaries.sum(&:payment_processor_fees)
      net_profit = payment_summaries.sum(&:net_profit)
      test_summary = PaidTests::TestCollectionSummary.new(
        test_collection: test_collection,
        start_time: @start_time,
        end_time: @end_time,
      )
      [
        test_collection.id,
        test_collection.name,
        revenue,
        test_summary.amount_owed,
        test_summary.amount_paid,
        payment_processor_fees,
        net_profit,
      ]
    end

    def payment_summaries_for_test_collection(test_collection)
      payments = test_collection.test_audiences.map(&:payment).compact
      payments.map do |payment|
        PaidTests::PaymentSummary.new(
          payment: payment,
          start_time: @start_time,
          end_time: @end_time,
        )
      end
    end

    def paid_test_collections
      Collection::TestCollection
        .joins(:test_audiences)
        .includes(test_audiences: :payment)
        .merge(
          TestAudience.paid,
        )
        .where(
          # We want to allow collections to be included from previous months,
          # (as they still may be collection responses/paying respondents),
          # but don't include any collections created after the export timeframe
          Collection::TestCollection
            .arel_table[:created_at]
            .lteq(@end_time),
        )
        .order(id: :desc)
        .distinct
    end
  end
end
