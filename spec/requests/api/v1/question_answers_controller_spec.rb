require 'rails_helper'

describe Api::V1::QuestionAnswersController, type: :request, json: true do
  let(:test_collection) { create(:test_collection, test_status: :live) }

  describe 'POST #create' do
    let(:survey_response) { create(:survey_response, test_collection: test_collection) }
    let(:path) { "/api/v1/survey_responses/#{survey_response.session_uid}/question_answers/" }
    let(:question) { create(:question_item) }
    let(:params) {
      json_api_params(
        'question_answers',
        'answer_text': 'I do not like green eggs and ham.',
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

    context 'with invalid test collection' do
      let(:test_collection) { create(:test_collection, test_status: :closed) }

      it 'returns a 400' do
        post(path, params: params)
        expect(response.status).to eq(400)
      end
    end
  end

  describe 'PATCH #update' do
    let(:survey_response) { create(:survey_response, test_collection: test_collection) }
    let(:question) { create(:question_item) }
    let(:question_answer) {
      create(
        :question_answer,
        survey_response: survey_response,
        question: question,
        answer_number: 1,
      )
    }
    let(:path) {
      "/api/v1/survey_responses/#{survey_response.session_uid}/question_answers/#{question_answer.id}"
    }
    let(:params) {
      json_api_params(
        'question_answers',
        'answer_number': 3,
        'question_id': question.id,
      )
    }

    it 'returns a 200' do
      patch(path, params: params)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      patch(path, params: params)
      expect(json['data']['attributes']).to match_json_schema('question_answer')
    end

    it 'updates the question answer' do
      expect(question_answer.answer_number).to eq 1
      expect { patch(path, params: params) }.not_to change(QuestionAnswer, 'count')
      expect(question_answer.reload.answer_number).to eq 3
    end

    context 'with invalid test collection' do
      let(:test_collection) { create(:test_collection, test_status: :closed) }

      it 'returns a 400' do
        patch(path, params: params)
        expect(response.status).to eq(400)
      end
    end
  end
end
