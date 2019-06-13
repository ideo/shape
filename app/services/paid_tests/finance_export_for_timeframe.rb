module PaidTests
  class FinanceExportForTimeframe < SimpleService
    def initialize(start_time:, end_time:)
      @start_time = start_time
      @end_time = end_time
    end

    def call
      CSV.generate do |csv|
        csv << csv_header
        paid_test_collections.each do |test_collection|
          csv << csv_line_for_test_collection(test_collection)
        end
      end
    end

    private

    def csv_header
      ['Test Collection ID', 'Test Name', 'Revenue', 'Amount Owed', 'Amount Paid', 'Payment Processing Fees']
    end

    def csv_line_for_test_collection(test_collection)
      payment_summaries = payment_summaries_for_test_collection(test_collection)
      test_summary = PaidTests::TestCollectionSummary.new(
        test_collection: test_collection,
        start_time: @start_time,
        end_time: @end_time,
      )
      [
        test_collection.id,
        test_collection.name,
        payment_summaries.sum(&:total_revenue),
        test_summary.amount_owed,
        test_summary.amount_paid,
        payment_summaries.sum(&:payment_processor_fees),
      ]
    end

    def payment_summaries_for_test_collection(test_collection)
      payments = test_collection.test_audiences.map(&:payment)
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
        .order(id: :desc)
    end
  end
end
