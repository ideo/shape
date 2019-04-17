require 'rails_helper'

describe Api::V1::SurveyResponsesController, type: :request, json: true do
  describe 'GET #show' do
    context 'when the user did not create the survey response' do
      let(:random_user) { create(:user) }
      let(:survey_response) { create(:survey_response, user_id: random_user.id) }
      let(:path) { "/api/v1/survey_responses/#{survey_response.id}" }

      it 'returns a 404' do
        get(path)
        expect(response.status).to eq(404)
      end
    end

    context 'when it is the users survey response', auth: true do
      let!(:current_user) { @user }
      let(:survey_response) { create(:survey_response, user_id: current_user.id) }
      let(:path) { "/api/v1/survey_responses/#{survey_response.id}" }

      it 'returns a 200' do
        get(path)
        expect(response.status).to eq(200)
      end
    end
  end

  describe 'POST #create' do
    let(:test_collection) { create(:test_collection) }
    let(:path) { '/api/v1/survey_responses' }
    let(:params) do
      json_api_params(
        'survey_responses',
        'test_collection_id': test_collection.id,
      )
    end

    context 'with invalid test status (draft)' do
      it 'returns a 422' do
        post(path, params: params)
        expect(response.status).to eq(422)
      end
    end

    context 'with valid test status (live)' do
      let(:test_collection) { create(:test_collection, test_status: :live) }

      it 'returns a 200' do
        post(path, params: params)
        expect(response.status).to eq(200)
      end

      it 'matches JSON schema' do
        post(path, params: params)
        expect(json['data']['attributes']).to match_json_schema('survey_response')
      end

      it 'saves the survey response' do
        expect { post(path, params: params) }.to change(SurveyResponse, :count).by(1)
      end
    end
  end
end
