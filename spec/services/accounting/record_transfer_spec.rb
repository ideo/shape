require 'rails_helper'

RSpec.describe Accounting::RecordTransfer, type: :service, truncate: true do
  describe '.incentive_paid' do
    let(:sample_size) { 5 }
    # this will get a negative rounding difference which we want to test for
    let(:price) { 4.65 }
    let(:payment) { build(:payment, amount: sample_size * price, network_payment_method_id: 99) }
    let(:test_audience) do
      create(:test_audience, price_per_response: price, sample_size: sample_size, test_collection: create(:test_collection))
    end
    let!(:survey_responses) do
      create_list(:survey_response, sample_size, status: :completed, test_audience: test_audience, user: create(:user))
    end
    let(:incentive) { TestAudience.incentive_amount }
    let(:owed) { incentive * sample_size }
    let(:payment_amount_after_fee) { payment.amount_without_stripe_fee.to_f }
    let(:deferred_total_after_responses) { payment_amount_after_fee - incentive * sample_size }

    before do
      allow(NetworkApi::Payment).to receive(:create).and_return(
        double(
          id: SecureRandom.hex(10),
          status: 'succeeded',
          errors: {},
        ),
      )
      payment.save
      # now we can attach the payment
      test_audience.update(payment: payment)

      expect(Accounting::Query.sum(:revenue_deferred)).to eq payment_amount_after_fee
      survey_responses.each(&:record_incentive_owed!)
      expect(Accounting::Query.sum(:revenue_deferred)).to eq deferred_total_after_responses.to_f
    end

    context 'before recording incentive paid' do
      it 'should have recorded the payment minus stripe fee in revenue_deferred' do
        expect(Accounting::Query.sum(:individual_owed)).to eq owed
        expect(Accounting::Query.sum(:revenue_deferred)).to eq((payment_amount_after_fee - owed).to_f)
      end
    end

    context 'after recording incentive paid for first response' do
      let(:survey_response) { survey_responses.first }

      before do
        Accounting::RecordTransfer.incentive_paid(survey_response)
      end

      it 'transfers from individual_owed to individual_paid' do
        expect(Accounting::Query.sum(:individual_owed)).to eq owed - incentive
        expect(Accounting::Query.sum(:individual_paid)).to eq incentive
      end

      it 'transfers from revenue_deferred to payment_processor and revenue; including rounding_difference' do
        paypal_fee = Accounting::RecordTransfer.paypal_fee(incentive)
        received_payment_per_response = (payment_amount_after_fee / sample_size).round(2)
        revenue = received_payment_per_response - incentive - paypal_fee
        paypal_and_stripe_fee = (paypal_fee.to_f.round(2) + payment.stripe_fee.to_f.round(2))

        # rounding_difference should get included in this first response
        rounding_difference = (payment_amount_after_fee - (received_payment_per_response * sample_size)).round(2)
        revenue += rounding_difference
        expect(rounding_difference).to eq(-0.02)

        revenue_deferred_result = (deferred_total_after_responses - revenue - paypal_fee).to_f.round(2)

        expect(Accounting::Query.sum(:revenue)).to eq revenue.to_f.round(2)
        expect(Accounting::Query.sum(:payment_processor)).to eq paypal_and_stripe_fee
        expect(Accounting::Query.sum(:revenue_deferred)).to eq revenue_deferred_result
      end
    end

    context 'after recording incentive paid for all responses' do
      before do
        survey_responses.each do |survey_response|
          Accounting::RecordTransfer.incentive_paid(survey_response)
        end
      end

      it 'transfers from individual_owed to individual_paid' do
        expect(Accounting::Query.sum(:individual_owed))
        expect(Accounting::Query.sum(:individual_paid))
      end

      it 'transfers from revenue_deferred to payment_processor and revenue' do
        paypal_fee = Accounting::RecordTransfer.paypal_fee(incentive) * sample_size
        revenue = deferred_total_after_responses - paypal_fee
        paypal_and_stripe_fee = (paypal_fee.to_f.round(2) + payment.stripe_fee.to_f.round(2))

        expect(Accounting::Query.sum(:revenue)).to eq revenue.to_f.round(2)
        expect(Accounting::Query.sum(:payment_processor)).to eq paypal_and_stripe_fee
        # at this point the revenue_deferred should have been fully transferred to zero
        expect(Accounting::Query.sum(:revenue_deferred)).to eq 0
      end
    end
  end
end
