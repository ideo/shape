require 'rails_helper'

describe Api::V1::SurveyResponsesController, type: :request, json: true do
  describe 'POST #create' do
    let(:test_collection) { create(:test_collection) }
    let(:path) { '/api/v1/survey_responses' }
    let(:params) {
      json_api_params(
        'survey_responses',
        'test_collection_id': test_collection.id,
      )
    }

    context 'with invalid test status (draft)' do
      it 'returns a 400' do
        post(path, params: params)
        expect(response.status).to eq(400)
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
