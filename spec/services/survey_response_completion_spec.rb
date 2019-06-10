require 'rails_helper'

describe SurveyResponseCompletion, type: :service do
  let(:test_collection) { create(:test_collection, :with_test_audience, test_status: :live) }
  let(:survey_response) { create(:survey_response, test_collection: test_collection) }
  let(:test_audience) { survey_response.test_audience }
  let(:service) { SurveyResponseCompletion.new(survey_response) }
  let(:payment_method_double) { double(id: SecureRandom.hex(10)) }
  let(:network_payment_double) { double(id: 5, status: 'succeeded') }

  before do
    allow(NetworkApi::Payment).to receive(:create).and_return(
      network_payment_double,
    )
    allow(NetworkApi::PaymentMethod).to receive(:find).and_return(
      [payment_method_double],
    )
  end

  describe '#call', :vcr do
    it 'should call CollectionUpdateBroadcaster with the test_collection if status changes' do
      expect(CollectionUpdateBroadcaster).to receive(:call).with(test_collection)
      service.call
    end

    context 'with a user' do
      let(:user) { create(:user) }
      before do
        survey_response.update(user: user)
      end

      it 'updates survey response payment status' do
        expect {
          service.call
        }.to change(survey_response, :payment_status)
        expect(survey_response.payment_status).to eq('payment_owed')
      end

      it 'will only mark amount owed once' do
        service.call
        expect(survey_response.incentive_owed_amount.to_f).to eq(test_audience.price_per_response)

        # call it again
        service.call
        expect(
          survey_response.reload.incentive_owed_amount.to_f,
        ).to eq(test_audience.price_per_response)

        expect(
          survey_response.user.incentive_owed_account_balance.to_f,
        ).to eq(test_audience.price_per_response)
      end

      context 'with an existing balance' do
        let(:test_collection) { create(:test_collection, :with_test_audience, test_status: :live) }
        let(:survey_response) { create(:survey_response, test_collection: test_collection, user: user) }

        it 'calculates the correct balance' do
          expect(user.current_incentive_balance).to eq 25.00
          service.call
          expect(user.current_incentive_balance).to eq 25.00 + Shape::FEEDBACK_INCENTIVE_AMOUNT
        end
      end
    end

    context 'without test audience' do
      let(:test_collection) { create(:test_collection) }

      it 'does not update survey response payment_status' do
        expect do
          service.call
        end.not_to change(survey_response, :payment_status)
      end

      it 'does not create accounting lines' do
        expect do
          service.call
        end.not_to change(DoubleEntry::Line, :count)
      end
    end

    context 'with link sharing' do
      let(:test_collection) { create(:test_collection, :with_link_sharing) }

      it 'does not create accounting lines' do
        expect do
          service.call
        end.not_to change(DoubleEntry::Line, :count)
      end
    end
  end
end
