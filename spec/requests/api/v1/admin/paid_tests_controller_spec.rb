require 'rails_helper'

describe Api::V1::Admin::PaidTestsController, type: :request, json: true, auth: true do
  let(:admin_user) { @user }
  before do
    admin_user.add_role(Role::SHAPE_ADMIN)
  end

  describe 'GET #pending_incentives_export', truncate: true do
    let!(:test_collection) { create(:test_collection, :with_test_audience, :completed, num_cards: 1) }
    let!(:test_audience) { test_collection.test_audiences.first }
    let!(:payment) { create(:payment, :paid, purchasable: test_audience, amount: test_audience.total_price) }
    let(:user) { create(:user) }
    let(:amount_owed) { TestAudience.incentive_amount }
    let(:survey_response) do
      create(
        :survey_response,
        :fully_answered,
        test_audience: test_audience,
        test_collection: test_collection,
        user: user,
      )
    end

    before do
      # Add balance to revenue_deferred account so we can debit from it
      DoubleEntry.transfer(
        Money.new(10_00),
        from: DoubleEntry.account(:cash, scope: payment),
        to: DoubleEntry.account(:revenue_deferred, scope: payment),
        code: :purchase,
      )
      test_collection.launch!
      expect(survey_response.completed?).to be true
      survey_response.record_incentive_owed!
      expect(survey_response.incentive_owed?).to be true
    end

    let(:path) { pending_incentives_export_api_v1_admin_paid_tests_path(format: 'csv') }

    context 'without admin role' do
      before do
        admin_user.remove_role(Role::SHAPE_ADMIN)
      end

      it 'returns a 401' do
        get(path)
        expect(response.status).to eq(401)
      end
    end

    it 'returns 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'returns csv' do
      get(path)
      csv = CSV.parse(response.body, headers: true)
      expect(csv[0].to_h).to eq(
        'User ID' => user.uid,
        'Name' => user.name,
        'Email' => user.email,
        'Phone' => user.phone,
        'Amount Owed' => format('%.2f', amount_owed),
        'Test Collection(s)' => test_collection.name,
        'Test Audience(s)' => test_audience.audience.name,
        'Completed/Owed At' => survey_response.incentive_owed_at.to_s,
      )
    end

    it 'marks response as paid' do
      expect(RecordPaidSurveyResponseWorker).to receive(:perform_async).with(survey_response.id)
      get(path)
    end

    context 'after requesting once' do
      before do
        survey_response.record_incentive_paid!
      end

      it 'returns empty csv' do
        get(path)
        csv = CSV.parse(response.body, headers: true)
        expect(csv.length).to eq(0)
      end
    end
  end

  describe 'GET #finance_export' do
    let(:path) { finance_export_api_v1_admin_paid_tests_path(month: 'July 2018', format: 'csv') }
    let(:header) { PaidTests::FinanceExportForTimeframe.csv_header }
    let(:sample_csv) do
      CSV.generate do |csv|
        csv << PaidTests::FinanceExportForTimeframe.csv_header
        csv << header.map { SecureRandom.hex(5) }
      end
    end

    before do
      allow(
        PaidTests::FinanceExportForTimeframe,
      ).to receive(:call).and_return(
        sample_csv,
      )
    end

    it 'returns 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'returns csv' do
      get(path)
      expect(response.body).to eq(sample_csv.to_s)
    end
  end

  describe 'GET #months_with_purchases', truncate: true do
    let!(:payments) do
      [
        create(:payment, :paid, created_at: Time.parse('June 2018')),
        create(:payment, :paid, created_at: Time.parse('July 2018')),
        create(:payment, :paid, created_at: Time.parse('September 2018')),
      ]
    end
    let(:path) { months_with_purchases_api_v1_admin_paid_tests_path }

    it 'returns month range' do
      get(path)
      expect(json['months']).to eq(
        ['June 2018', 'July 2018', 'August 2018', 'September 2018'],
      )
    end
  end
end
