require 'rails_helper'

describe SurveyResponseCompletion, type: :service, truncate: true do
  let(:test_collection) { create(:test_collection, :with_test_audience, :completed, :launched) }
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
    test_audience.update(price_per_response: 4.50, sample_size: 5)
    allow(NetworkApi::Payment).to receive(:create).and_return(
      network_payment_double,
    )
    allow(NetworkApi::PaymentMethod).to receive(:find).and_return(
      [payment_method_double],
    )
  end

  describe '#call' do
    let(:test_results_collection) { test_collection.test_results_collection }

    context 'when test audience is open' do
      before do
        allow(CreateSurveyResponseAliasCollectionWorker).to receive(:perform_async).and_call_original
      end

      it 'marks the survey_response as completed' do
        expect(survey_response.completed?).to be false
        service.call
        expect(survey_response.completed?).to be true
      end

      it 'calls CreateSurveyResponseAliasCollectionWorker' do
        expect(CreateSurveyResponseAliasCollectionWorker).to receive(:perform_async).with(survey_response.id)
        service.call
      end
    end

    context 'when test audience is closed' do
      before do
        test_audience.closed!
      end

      it 'marks the survey_response as completed_late' do
        expect(survey_response.completed_late?).to be false
        service.call
        expect(survey_response.completed_late?).to be true
      end
    end

    context 'when test audience is closed, but it is an in-collection test' do
      before do
        test_collection.collection_to_test = create(:collection)
        test_audience.closed!
      end

      it 'marks the survey_response as completed' do
        expect(survey_response.completed?).to be false
        service.call
        expect(survey_response.completed?).to be true
      end
    end

    context 'when sample size has not been reached' do
      before do
        test_audience.update(sample_size: 5)
      end

      it 'does not close the test audience' do
        expect(test_audience.status).to eq 'open'
        service.call
        expect(test_audience.status).to eq 'open'
      end
    end

    context 'when test audience has reached sample size' do
      before do
        test_audience.update(sample_size: 1)
      end

      it 'updates the test audience status' do
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
      end

      it 'updates survey response payment status' do
        expect {
          service.call
        }.to change(survey_response, :incentive_status)
        expect(survey_response.incentive_status).to eq('incentive_owed')
      end

      context 'unpaid, but user already has a completed survey response' do
        before do
          survey_response.update(status: :completed)
          test_audience.update(price_per_response: 0)
        end

        it 'marks the survey_response as duplicate' do
          expect(survey_response2.duplicate?).to be false
          SurveyResponseCompletion.call(survey_response2)
          expect(survey_response2.duplicate?).to be true
        end
      end

      it 'will only mark amount owed once and not for additional dupe survey response' do
        service.call
        expect(
          user.incentive_owed_account_balance.to_f,
        ).to eq(TestAudience.incentive_amount)

        # call it again, balance shouldn't change
        service.call
        expect(
          user.reload.incentive_owed_account_balance.to_f,
        ).to eq(TestAudience.incentive_amount)

        # call it with a 2nd response
        SurveyResponseCompletion.call(survey_response2)
        expect(
          user.reload.incentive_owed_account_balance.to_f,
        ).to eq(TestAudience.incentive_amount)
        # dupe response remains unearned
        expect(survey_response2.incentive_unearned?).to be true
        expect(survey_response2.duplicate?).to be true
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
      let(:survey_response2) { create(:survey_response, test_collection: test_collection, test_audience: test_audience) }
      before do
        test_audience.update(price_per_response: 0.0)
      end

      it 'does not create accounting lines' do
        expect(survey_response.gives_incentive?).to be false
        expect do
          service.call
        end.not_to change(DoubleEntry::Line, :count)
      end

      it 'does not mark anonymous survey_responses as duplicates' do
        SurveyResponseCompletion.call(survey_response)
        SurveyResponseCompletion.call(survey_response2)
        expect(survey_response.completed?).to be true
        expect(survey_response.duplicate?).to be false
        expect(survey_response2.completed?).to be true
        expect(survey_response2.duplicate?).to be false
      end
    end
  end
end
