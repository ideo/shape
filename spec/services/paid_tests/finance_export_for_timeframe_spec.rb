require 'rails_helper'

RSpec.describe PaidTests::FinanceExportForTimeframe, type: :service, truncate: true do
  let(:start_time) { 1.month.ago.beginning_of_month.beginning_of_day }
  let(:end_time) { start_time.end_of_month.end_of_day }
  before { Timecop.travel(start_time + 1.day) }
  let!(:test_collection) { create(:test_collection) }
  let(:user) { create(:user) }
  let(:user_2) { create(:user) }
  let(:test_audience) { create(:test_audience, :payment, sample_size: 10, price_per_response: 4.75, test_collection: test_collection) }
  let(:survey_response_owed) { create(:survey_response, user: user, test_audience: test_audience, test_collection: test_collection) }
  let(:survey_response_paid) { create(:survey_response, user: user_2, test_audience: test_audience, test_collection: test_collection) }
  let(:incentive_amount) { TestAudience.incentive_amount }
  let(:sample_size) { test_audience.sample_size }

  before do
    allow_any_instance_of(SurveyResponse).to receive(:completed?).and_return(true)
    SurveyResponseCompletion.call(survey_response_owed)
    SurveyResponseCompletion.call(survey_response_paid)
    survey_response_paid.record_incentive_paid!
  end

  subject do
    PaidTests::FinanceExportForTimeframe.call(
      start_time: start_time,
      end_time: end_time,
    )
  end

  describe '#call' do
    let(:csv) { CSV.parse(subject, headers: true) }
    let(:revenue) { test_audience.total_price }
    let(:paypal_fee) { Accounting::RecordTransfer.paypal_fee(incentive_amount) }
    let(:payment_processing_fees) { test_audience.stripe_fee + paypal_fee }
    let(:calculator) { Accounting::SurveyResponseRevenue.new(survey_response_paid) }
    # net_profit should be the calculated revenue from the one paid response
    let(:net_profit) { calculator.revenue }
    let(:amount_paid) { incentive_amount.to_s }
    let(:expected_csv_line) do
      {
        'Test Collection ID' => test_collection.id.to_s,
        'Test Name' => test_collection.name,
        'Revenue' => revenue.to_s,
        'Amount Owed' => incentive_amount.to_s,
        'Amount Paid' => amount_paid,
        'Payment Processing Fees' => payment_processing_fees.to_s,
        'Net Profit' => net_profit.to_s,
      }
    end

    it 'returns expected headers' do
      expect(csv.headers).to match_array(
        ['Test Collection ID', 'Test Name', 'Revenue', 'Amount Owed', 'Amount Paid', 'Payment Processing Fees', 'Net Profit'],
      )
    end

    it 'has expected test data for timeframe' do
      expect(csv[0].to_h).to eq(expected_csv_line)
    end

    context 'with multiple paid responses' do
      let(:user_3) { create(:user) }
      let!(:survey_response_paid_2) do
        create(:survey_response, user: user_3, test_audience: test_audience, test_collection: test_collection)
      end
      let(:calculator_2) { Accounting::SurveyResponseRevenue.new(survey_response_paid_2) }
      let(:net_profit) { calculator.revenue + calculator_2.revenue }
      let(:paypal_fee) { Accounting::RecordTransfer.paypal_fee(incentive_amount) * 2 }
      let(:amount_paid) { (incentive_amount * 2).to_s }

      before do
        SurveyResponseCompletion.call(survey_response_paid_2)
        survey_response_paid_2.record_incentive_paid!
      end

      it 'has expected test data for timeframe' do
        expect(csv[0].to_h).to eq(expected_csv_line)
      end
    end

    context 'with additional purchases the next month' do
      before { Timecop.travel(end_time + 1.day) }
      let!(:test_audience) { create(:test_audience, :payment, sample_size: 10, price_per_response: 4.75, test_collection: test_collection) }
      let!(:survey_response_owed_next_month) do
        create(:survey_response, user: user, test_audience: test_audience, test_collection: test_collection)
      end
      let!(:survey_response_paid_next_month) do
        create(:survey_response, user: user_2, test_audience: test_audience, test_collection: test_collection)
      end
      before do
        SurveyResponseCompletion.call(survey_response_owed_next_month)
        SurveyResponseCompletion.call(survey_response_paid_next_month)
        survey_response_paid_next_month.record_incentive_paid!
      end

      it 'does not affect export data for previous month' do
        expect(csv[0].to_h).to eq(expected_csv_line)
      end
    end
  end
end
