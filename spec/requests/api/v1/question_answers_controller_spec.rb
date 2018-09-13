require 'rails_helper'

describe Api::V1::QuestionAnswersController, type: :request, json: true do
  describe 'POST #create' do
    let(:survey_response) { create(:survey_response) }
    let(:path) { "/api/v1/survey_responses/#{survey_response.session_uid}/question_answers/" }
    let(:question) { create(:question_item) }
    let(:params) {
      json_api_params(
        'question_answers',
        'answer_text': 'I hate this so much',
        'answer_number': nil,
        'question_id': question.id,
      )
    }

    it 'returns a 200' do
      post(path, params: params)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      post(path, params: params)
      expect(json['data']['attributes']).to match_json_schema('question_answer')
    end

    it 'saves the question answer' do
      expect { post(path, params: params) }.to change(QuestionAnswer, :count).by(1)
    end
  end
end
