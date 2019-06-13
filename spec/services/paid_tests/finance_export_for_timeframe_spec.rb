require 'rails_helper'

RSpec.describe PaidTests::FinanceExportForTimeframe, type: :service, truncate: true do
  let(:start_time) { 1.month.ago.beginning_of_month.beginning_of_day }
  let(:end_time) { start_time.end_of_month.end_of_day }
  before { Timecop.travel(start_time + 1.day) }
  let!(:test_collection) { create(:test_collection) }
  let(:user) { create(:user) }
  let(:user_2) { create(:user) }
  let(:test_audience) { create(:test_audience, :payment, sample_size: 10, price_per_response: 4.75, test_collection: test_collection) }
  let(:survey_response_owed) { create(:survey_response, user: user, test_audience: test_audience) }
  let(:survey_response_paid) { create(:survey_response, user: user_2, test_audience: test_audience) }
  let(:paypal_fee) { (incentive_amount * 0.05).round(2) }
  let(:incentive_amount) { 2.50 }
  let(:our_earning) { test_audience.price_per_response - incentive_amount - paypal_fee }

  before do
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

    it 'returns expected headers' do
      expect(csv[0].keys).to eq({})
    end

    it 'has expected test data for timeframe' do
      expect(csv[0]['Test Collection ID']).to eq(test_collection.id)
      expect(csv[0]['Test Name']).to eq(test_collection.name)
      expect(csv[0]['Revenue']).to eq(test_audience.total_price)
      expect(csv[0]['Amount Owed']).to eq(incentive_amount)
      expect(csv[0]['Amount Paid']).to eq(incentive_amount)
      expect(csv[0]['Payment Processing Fees']).to eq(test_audience.stripe_fee + paypal_fee)
    end
  end
end
