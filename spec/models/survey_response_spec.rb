require 'rails_helper'

RSpec.describe SurveyResponse, type: :model do
  context 'associations' do
    it { should belong_to(:test_collection) }
    it { should belong_to(:user) }
    it { should have_many(:question_answers) }
  end

  before do
    ENV['TEST_DYNAMIC_PRICING_LAUNCHED_AT'] = 1.day.ago.to_s
  end

  describe 'callbacks' do
    describe '#create_alias' do
      let!(:survey_response) { create(:survey_response) }

      it 'generates a uniq name as the respondent_alias' do
        expect(survey_response.respondent_alias).to be_kind_of(String)
      end
    end
  end

  describe '#question_answer_created_or_destroyed' do
    let(:test_collection) { create(:test_collection, :launched) }
    let(:survey_response) { create(:survey_response, test_collection: test_collection) }

    it 'changes updated_at' do
      expect {
        survey_response.question_answer_created_or_destroyed
      }.to change(survey_response, :updated_at)
    end

    it 'keeps status as in_progress' do
      expect(survey_response.in_progress?).to be true
    end

    context 'with all questions answered' do
      let(:create_question_answers) do
        SurveyResponseValidation.new(survey_response).answerable_ids.each do |item_id, idea_id|
          create(:question_answer,
                 survey_response: survey_response,
                 question_id: item_id,
                 idea_id: idea_id)
        end
      end

      it 'calls SurveyResponseCompletion to mark response as completed' do
        expect(SurveyResponseCompletion).to receive(:call).with(survey_response)
        create_question_answers
      end

      context 'with paid audience and no user' do
        let(:test_audience) { create(:test_audience, test_collection: test_collection) }
        let(:survey_response) do
          create(:survey_response, test_audience: test_audience, status: :completed, test_collection: test_collection)
        end

        it 'calls SurveyResponseCompletionWorker to await marking response completed' do
          expect(SurveyResponseCompletionWorker).to receive(:perform_in).with(
            1.minute,
            survey_response.id,
          )
          create_question_answers
        end
      end
    end
  end

  describe '#cache_test_scores!' do
    let(:submission) { create(:collection) }
    let!(:test_collection) { create(:test_collection, parent_collection: submission) }
    let!(:survey_response) { create(:survey_response, test_collection: test_collection) }

    before do
      submission.update(submission_attrs: { submission: true, launchable_test_id: test_collection.id })
    end

    it 'should call cache_test_scores! on the parent_submission' do
      expect(test_collection.parent_submission.cached_test_scores).to be_nil
      survey_response.cache_test_scores!
      expect(test_collection.parent_submission.cached_test_scores).to eq(
        'total' => 0,
        'question_category_satisfaction' => 0,
        'question_clarity' => 0,
        'question_excitement' => 0,
        'question_useful' => 0,
      )
    end
  end

  # Truncation must be used when testing double entry
  describe '#record_incentive_owed!', truncate: true do
    let(:user) { create(:user) }
    let!(:test_collection) { create(:test_collection) }
    let(:test_audience) { create(:test_audience, :payment, test_collection: test_collection) }
    let(:payment) { test_audience.payment }
    let(:survey_response) { create(:survey_response, user: user, test_audience: test_audience, status: :completed) }
    let(:revenue_deferred_account) { DoubleEntry.account(:revenue_deferred, scope: test_audience.payment) }
    let(:incentive_per_response) { Audience.incentive_per_response(test_collection.paid_question_items.size) }

    it 'updates incentive_status' do
      expect {
        survey_response.record_incentive_owed!
      }.to change(survey_response, :incentive_status)
      expect(survey_response.incentive_owed?).to be true
    end

    it 'increases individual_owed balance' do
      expect {
        survey_response.record_incentive_owed!
      }.to change(user.incentive_owed_account, :balance)
      expect(user.incentive_owed_account_balance.to_f).to eq(incentive_per_response)
    end

    it 'decreases revenue_deferred balance' do
      expect {
        survey_response.record_incentive_owed!
      }.to change(revenue_deferred_account, :balance)
      expect(revenue_deferred_account.balance.to_f).to eq(payment.amount.to_f - payment.stripe_fee - incentive_per_response)
    end
  end

  # Truncation must be used when testing double entry
  describe '#record_incentive_paid!', truncate: true do
    let(:user) { create(:user) }
    let!(:test_collection) { create(:test_collection) }
    let(:test_audience) { create(:test_audience, :payment, sample_size: 10, test_collection: test_collection) }
    let(:survey_response) { create(:survey_response, user: user, test_audience: test_audience, status: :completed) }
    let(:revenue_deferred_account) { DoubleEntry.account(:revenue_deferred, scope: test_audience.payment) }
    let(:payment_processor_account) { DoubleEntry.account(:payment_processor, scope: test_audience.payment) }
    let(:revenue_account) { DoubleEntry.account(:revenue, scope: test_audience.payment) }
    let(:incentive_amount) { Audience.incentive_per_response(test_collection.paid_question_items.size) }
    let(:calculator) { Accounting::SurveyResponseRevenue.new(survey_response) }
    let(:paypal_fee) { calculator.paypal_fee }
    let(:our_earning) { calculator.revenue }

    before do
      survey_response.record_incentive_owed!
    end

    it 'updates incentive_status' do
      expect {
        survey_response.record_incentive_paid!
      }.to change(survey_response, :incentive_status)
      expect(survey_response.incentive_paid?).to be true
      expect(survey_response.incentive_paid_amount).to eq(incentive_amount)
    end

    it 'increases individual_paid balance' do
      expect {
        survey_response.record_incentive_paid!
      }.to change(user.incentive_paid_account, :balance)
      expect(user.incentive_paid_account_balance.to_f).to eq(incentive_amount)
    end

    it 'decreases individual_owed balance' do
      expect {
        survey_response.record_incentive_paid!
      }.to change(user.incentive_owed_account, :balance)
      expect(user.incentive_owed_account_balance.to_f).to eq(0)
    end

    it 'decreases revenue_deferred account balance by paypal fee + our earning' do
      previous_balance = revenue_deferred_account.balance.to_f
      expect {
        survey_response.record_incentive_paid!
      }.to change(revenue_deferred_account, :balance)
      expect(revenue_deferred_account.balance.to_f).to eq(
        previous_balance - paypal_fee - our_earning,
      )
    end

    it 'increases payment_processor balance by paypal fee' do
      previous_balance = payment_processor_account.balance.to_f
      expect {
        survey_response.record_incentive_paid!
      }.to change(payment_processor_account, :balance)
      expect(payment_processor_account.balance.to_f).to eq(
        (previous_balance + paypal_fee).round(2),
      )
    end

    it 'increases revenue balance by our earning' do
      expect {
        survey_response.record_incentive_paid!
      }.to change(revenue_account, :balance)
      expect(revenue_account.balance.to_f).to eq(our_earning)
    end
  end

  describe '#amount_earned' do
    let!(:test_collection) { create(:test_collection) }
    let(:test_audience) { create(:test_audience, test_collection: test_collection) }
    let(:survey_response) { create(:survey_response, test_audience: test_audience, status: :completed, incentive_owed_at: Time.current) }
    let(:incentive_per_response) { Audience.incentive_per_response(test_collection.paid_question_items.size) }

    it 'returns fixed incentive amount' do
      expect(survey_response.amount_earned.to_f).to eq(incentive_per_response)
    end

    context 'if not completed' do
      before do
        survey_response.update_columns(status: SurveyResponse.statuses[:in_progress])
      end

      it 'is 0' do
        expect(survey_response.amount_earned).to eq(0)
      end
    end

    context 'if test audience is blank' do
      before do
        survey_response.update(test_audience: nil)
      end

      it 'is 0' do
        expect(survey_response.amount_earned).to eq(0)
      end
    end

    context 'for response paid out before before TEST_DYNAMIC_PRICING_LAUNCHED_AT' do
      before do
        ENV['TEST_DYNAMIC_PRICING_LAUNCHED_AT'] = 1.day.from_now.to_s
      end

      it 'returns LEGACY_INCENTIVE_PER_RESPONDENT' do
        expect(survey_response.amount_earned).to eq(Audience::LEGACY_INCENTIVE_PER_RESPONDENT)
      end
    end
  end
end
