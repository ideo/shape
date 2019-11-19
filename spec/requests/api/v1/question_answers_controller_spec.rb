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
        answer_number: 2,
        question_id: question.id,
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

    context 'with idea_id' do
      let!(:idea) { create(:video_item, question_type: :question_idea) }
      let(:params) {
        json_api_params(
          'question_answers',
          answer_number: 2,
          question_id: question.id,
          idea_id: idea.id,
        )
      }

      it 'saves the question answer' do
        expect { post(path, params: params) }.to change(QuestionAnswer, :count).by(1)
        expect(json['data']['attributes']).to match_json_schema('question_answer')
        expect(json['data']['attributes']['idea_id']).to eq idea.id.to_s
        answer = QuestionAnswer.find(json['data']['id'])
        expect(answer.idea).to eq idea
      end
    end

    context 'with closed test collection' do
      context 'within 10 minutes of closing' do
        let(:test_collection) { create(:test_collection, test_status: :closed, test_closed_at: 5.minutes.ago) }

        it 'returns a 200' do
          post(path, params: params)
          expect(response.status).to eq(200)
        end
      end

      context 'after 10 minutes of being closed' do
        let(:test_collection) { create(:test_collection, test_status: :closed, test_closed_at: 11.minutes.ago) }

        it 'returns a 422' do
          post(path, params: params)
          expect(response.status).to eq(422)
        end
      end

      context 'with no answer number' do
        let(:params_without_answer) do
          json_api_params(
            'question_answers',
            'answer_number': nil,
            'question_id': question.id,
          )
        end

        it 'returns a 422' do
          post(path, params: params_without_answer)
          expect(response.status).to eq(422)
        end
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
        answer_number: 3,
        question_id: question.id,
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

      it 'returns a 422' do
        patch(path, params: params)
        expect(response.status).to eq(422)
      end
    end
  end
end
