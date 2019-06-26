require 'rails_helper'

RSpec.describe SurveyResponse, type: :model do
  context 'associations' do
    it { should belong_to(:test_collection) }
    it { should belong_to(:user) }
    it { should have_many(:question_answers) }
    it { should have_one(:feedback_incentive_record) }
  end

  describe 'callbacks' do
    describe '#create_open_response_items' do
      let!(:test_collection) { create(:test_collection, :open_response_questions) }
      let!(:survey_response) { create(:survey_response, test_collection: test_collection) }
      let(:author) { create(:user) }

      before do
        test_collection.launch!(initiated_by: author)
      end

      it 'creates open response items for each open response question' do
        expect {
          # Answer all questions
          test_collection.question_items.map do |question|
            create(:question_answer,
                   survey_response: survey_response,
                   question: question)
          end
        }.to change(Item::TextItem, :count).by(test_collection.question_items.size)
        expect(
          survey_response.question_answers.all? do |answer|
            answer.open_response_item.present?
          end,
        ).to be true
      end
    end
  end

  describe '#all_questions_answered?' do
    # Turn the 4 default cards into 4 answerable cards
    let(:test_collection) { create(:test_collection, :answerable_questions) }
    let(:survey_response) { create(:survey_response, test_collection: test_collection) }

    before do
      # this will move the questions into the TestDesign and allow the delegation to work
      test_collection.launch!
    end

    context 'no questions answered' do
      it 'returns false' do
        expect(survey_response.all_questions_answered?).to be false
      end
    end

    context 'some questions answered' do
      let!(:question_answer) do
        create(:question_answer,
               survey_response: survey_response,
               question: survey_response.answerable_complete_question_items.first)
      end

      it 'returns false' do
        expect(survey_response.all_questions_answered?).to be false
      end
    end

    context 'all questions answered' do
      let!(:question_answers) do
        survey_response.answerable_complete_question_items.map do |question|
          create(:question_answer,
                 survey_response: survey_response,
                 question: question)
        end
      end

      it 'returns true' do
        expect(survey_response.all_questions_answered?).to be true
      end
    end
  end

  describe '#question_answer_created_or_destroyed' do
    let(:test_collection) { create(:test_collection, :answerable_questions) }
    let(:survey_response) { create(:survey_response, test_collection: test_collection) }

    before do
      # this will move the questions into the TestDesign and allow the delegation to work
      test_collection.launch!
    end

    it 'changes updated_at' do
      expect {
        survey_response.question_answer_created_or_destroyed
      }.to change(survey_response, :updated_at)
    end

    it 'keeps status as in_progress' do
      expect(survey_response.in_progress?).to be true
    end

    context 'with all questions answered' do
      let!(:question_answers) do
        survey_response.answerable_complete_question_items.map do |question|
          create(:question_answer,
                 survey_response: survey_response,
                 question: question)
        end
      end

      it 'marks response as completed' do
        expect(survey_response.reload.completed?).to be true
      end
    end
  end

  describe '#cache_test_scores!' do
    let(:submission) { create(:collection) }
    let!(:test_collection) { create(:test_collection, :answerable_questions, parent_collection: submission) }
    let!(:survey_response) { create(:survey_response, test_collection: test_collection) }

    before do
      submission.update(submission_attrs: { submission: true, launchable_test_id: test_collection.id })
    end

    it 'should call cache_test_scores! on the parent_submission' do
      survey_response.cache_test_scores!
      expect(test_collection.parent_submission.cached_test_scores).to eq('total' => 0, 'question_context' => 0)
    end
  end

  # Truncation must be used when testing double entry
  describe '#record_incentive_owed!', truncate: true do
    let(:user) { create(:user) }
    let!(:test_collection) { create(:test_collection) }
    let(:test_audience) { create(:test_audience, :payment, test_collection: test_collection, price_per_response: 4.75) }
    let(:payment) { test_audience.payment }
    let(:survey_response) { create(:survey_response, user: user, test_audience: test_audience, status: :completed) }
    let(:revenue_deferred_account) { DoubleEntry.account(:revenue_deferred, scope: test_audience.payment) }

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
      expect(user.incentive_owed_account_balance.to_f).to eq(TestAudience.incentive_amount)
    end

    it 'decreases revenue_deferred balance' do
      expect {
        survey_response.record_incentive_owed!
      }.to change(revenue_deferred_account, :balance)
      expect(revenue_deferred_account.balance.to_f).to eq(payment.amount.to_f - payment.stripe_fee - TestAudience.incentive_amount)
    end
  end

  # Truncation must be used when testing double entry
  describe '#record_incentive_paid!', truncate: true do
    let(:user) { create(:user) }
    let!(:test_collection) { create(:test_collection) }
    let(:test_audience) { create(:test_audience, :payment, test_collection: test_collection, price_per_response: 4.75) }
    let(:survey_response) { create(:survey_response, user: user, test_audience: test_audience, status: :completed) }
    let(:revenue_deferred_account) { DoubleEntry.account(:revenue_deferred, scope: test_audience.payment) }
    let(:payment_processor_account) { DoubleEntry.account(:payment_processor, scope: test_audience.payment) }
    let(:revenue_account) { DoubleEntry.account(:revenue, scope: test_audience.payment) }
    let(:incentive_amount) { TestAudience.incentive_amount }
    let(:paypal_fee) { (incentive_amount * 0.05).round(2) }
    let(:divided_stripe_fee) { test_audience.payment.stripe_fee / test_audience.sample_size }
    let(:our_earning) { test_audience.price_per_response - divided_stripe_fee - incentive_amount - paypal_fee }

    before do
      survey_response.record_incentive_owed!
    end

    it 'updates incentive_status' do
      expect {
        survey_response.record_incentive_paid!
      }.to change(survey_response, :incentive_status)
      expect(survey_response.incentive_paid?).to be true
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
      expect(revenue_deferred_account.balance).to eq 0
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
    let(:test_audience) { create(:test_audience, test_collection: test_collection, price_per_response: 4.75) }
    let(:survey_response) { create(:survey_response, test_audience: test_audience, status: :completed) }

    it 'returns fixed incentive amount' do
      expect(survey_response.amount_earned.to_f).to eq(TestAudience.incentive_amount)
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
  end
end
