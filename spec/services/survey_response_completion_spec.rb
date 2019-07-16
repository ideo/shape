require 'rails_helper'

describe SurveyResponseCompletion, type: :service, truncate: true do
  let(:test_collection) { create(:test_collection, :with_test_audience, :completed, num_cards: 1, test_status: :live) }
  let(:test_audience) { test_collection.test_audiences.first }
  let!(:payment) { create(:payment, :paid, purchasable: test_audience, amount: test_audience.total_price) }
  let(:survey_response) { create(:survey_response, test_collection: test_collection, test_audience: test_audience) }
  let(:service) { SurveyResponseCompletion.new(survey_response) }
  let(:payment_method_double) { double(id: rand(1000..100_000)) }
  let(:network_payment_double) { double(id: 5, status: 'succeeded') }

  before do
    # Add balance to revenue_deferred account so we can debit from it
    DoubleEntry.transfer(
      Money.new(10_00),
      from: DoubleEntry.account(:cash, scope: payment),
      to: DoubleEntry.account(:revenue_deferred, scope: payment),
      code: :purchase,
    )
    test_audience.update(price_per_response: 4.50)
    allow(NetworkApi::Payment).to receive(:create).and_return(
      network_payment_double,
    )
    allow(NetworkApi::PaymentMethod).to receive(:find).and_return(
      [payment_method_double],
    )
    allow(survey_response).to receive(:completed?).and_return(true)
  end

  describe '#call' do
    it 'should call CollectionUpdateBroadcaster with the test_collection if status changes' do
      expect(CollectionUpdateBroadcaster).to receive(:call).with(test_collection)
      service.call
    end

    context 'when sample size has not been reached' do
      it 'returns nil and test_audience remains open' do
        expect(test_collection).not_to receive(:test_audience_closed!)
        service.call
        expect(test_audience.status).to eq 'open'
      end
    end

    context 'when test audience has reached sample size' do
      before do
        allow(test_audience).to receive(:reached_sample_size?).and_return(true)
      end

      it 'updates the status' do
        expect(test_audience.status).to eq 'open'
        service.call
        expect(test_audience.status).to eq 'closed'
      end

      it 'calls test_collection.test_audience_closed!' do
        expect(test_collection).to receive(:test_audience_closed!)
        service.call
      end

      context 'when already closed' do
        it 'does not call test_collection.test_audience_closed!' do
          test_audience.closed!
          expect(test_collection).not_to receive(:test_audience_closed!)
          service.call
        end
      end
    end

    context 'with a user' do
      let(:user) { create(:user) }
      let(:survey_response2) { create(:survey_response, test_collection: test_collection, test_audience: test_audience) }

      before do
        survey_response.update(user: user)
        survey_response2.update(user: user)
        allow(survey_response2).to receive(:completed?).and_return(true)
      end

      it 'updates survey response payment status' do
        expect {
          service.call
        }.to change(survey_response, :incentive_status)
        expect(survey_response.incentive_status).to eq('incentive_owed')
      end

      it 'will only mark amount owed once' do
        service.call
        expect(
          user.incentive_owed_account_balance.to_f,
        ).to eq(TestAudience.incentive_amount)

        # call it again
        service.call
        expect(
          user.reload.incentive_owed_account_balance.to_f,
        ).to eq(TestAudience.incentive_amount)

        # call it with a 2nd response
        SurveyResponseCompletion.call(survey_response2)
        expect(
          user.reload.incentive_owed_account_balance.to_f,
        ).to eq(TestAudience.incentive_amount)
        expect(survey_response2.incentive_unearned?).to be true
      end

      context 'with an existing balance' do
        before do
          DoubleEntry.transfer(
            Money.new(TestAudience.incentive_amount * 100),
            from: DoubleEntry.account(:revenue_deferred, scope: payment),
            to: DoubleEntry.account(:individual_owed, scope: user),
            code: :incentive_owed,
            metadata: { survey_response_id: rand(1000) },
          )
        end

        it 'calculates the correct balance' do
          expect(user.incentive_owed_account_balance.to_f).to eq 2.50
          service.call
          expect(user.incentive_owed_account_balance.to_f).to eq 2.50 + Shape::FEEDBACK_INCENTIVE_AMOUNT
        end
      end
    end

    context 'without test audience' do
      before do
        test_collection.test_audiences.delete_all
      end

      it 'does not update survey response payment_status' do
        expect do
          service.call
        end.not_to change(survey_response, :incentive_status)
      end

      it 'does not create accounting lines' do
        expect do
          service.call
        end.not_to change(DoubleEntry::Line, :count)
      end
    end

    context 'with link sharing' do
      before do
        test_audience.update(price_per_response: 0.0)
      end

      it 'does not create accounting lines' do
        expect(survey_response.gives_incentive?).to be false
        expect do
          service.call
        end.not_to change(DoubleEntry::Line, :count)
      end
    end
  end
end
