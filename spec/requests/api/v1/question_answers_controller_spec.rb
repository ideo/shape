require 'rails_helper'

describe Api::V1::QuestionAnswersController, type: :request, json: true, auth: true do
  let(:user) { @user }

  describe 'POST #create' do
    let(:path) { '/api/v1/question_answers/' }
    let(:question) { create(:question_item) }
    let(:survey_response) { create(:survey_response) }
    let(:params) {
      json_api_params(
        'activities',
        'answer_text': 'I hate this so much',
        'answer_number': nil,
        'survey_response_id': survey_response.id,
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
