require 'rails_helper'

describe SurveyResponseCompletion, type: :service do
  let(:test_collection) { create(:test_collection, :with_test_audience) }
  let(:survey_response) { create(:survey_response, test_collection: test_collection) }
  let(:service) { SurveyResponseCompletion.new(survey_response) }

  it 'marks the survey_response as complete' do
    expect {
      service.call
    }.to change(survey_response, :status)
    expect(survey_response.status).to eq 'completed'
  end

  it 'should call CollectionUpdateBroadcaster with the test_collection if status changes' do
    expect(CollectionUpdateBroadcaster).to receive(:call).with(test_collection)
    service.call
  end

  context 'with a user' do
    let(:user) { create(:user) }
    before do
      survey_response.update(user: user)
    end

    it 'will only create one feedback_incentive_record per survey_response' do
      expect {
        service.call
      }.to change(FeedbackIncentiveRecord, :count).by 1
      # call it again
      expect {
        service.call
      }.not_to change(FeedbackIncentiveRecord, :count)
    end

    context 'with an existing balance' do
      let!(:feedback_incentive_record) { create(:feedback_incentive_record, user: user, current_balance: 25.00) }

      it 'calculates the correct balance' do
        expect(user.current_incentive_balance).to eq 25.00
        service.call
        expect(user.current_incentive_balance).to eq 25.00 + ::FEEDBACK_INCENTIVE_AMOUNT
      end
    end
  end

  context 'without test audience' do
    let(:test_collection) { create(:test_collection) }

    it 'does not create feedback_incentive_records' do
      expect {
        service.call
      }.not_to change(FeedbackIncentiveRecord, :count)
    end
  end
end
