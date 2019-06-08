require 'rails_helper'

describe Api::V1::Admin::FeedbackIncentivesController, type: :request, json: true, auth: true do
  let(:admin_user) { @user }
  let(:test_collection) { create(:test_collection, :with_test_audience, test_status: :live) }
  let(:test_audience) { test_collection.test_audiences.first }
  let(:user) { create(:user) }
  let(:amount_owed) { test_audience.price_per_response }
  let(:survey_response) do
    create(
      :survey_response,
      test_audience: test_audience,
      test_collection: test_collection,
      user: user,
    )
  end

  before do
    survey_response.record_incentive_owed!
    admin_user.add_role(Role::SHAPE_ADMIN)
  end

  describe 'GET #index' do
    let(:path) { api_v1_admin_feedback_incentives_path(format: 'csv') }

    it 'returns 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'returns csv' do
      get(path)
      csv = CSV.parse(response.body)
      expect(csv[1]).to eq(
        [user.uid, user.name, user.phone, amount_owed],
      )
    end
  end

  describe 'POST #mark_all_paid' do
    let(:path) { mark_all_paid_api_v1_admin_feedback_incentives_path }

    it 'updates all responses to status of paid' do
      expect(survey_response.incentive_owed?).to be true
      expect {
        post(path)
      }.to change(survey_response, :incentive_status)
      expect(survey_response.reload.incentive_paid?).to be true
    end
  end
end
