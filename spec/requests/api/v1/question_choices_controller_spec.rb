require 'rails_helper'

describe Api::V1::QuestionChoicesController, type: :request, json: true, auth: true do
  let(:user) { @user }

  describe 'POST #create' do
    let!(:question) { create(:question_item, question_type: :question_single_choice) }

    let(:path) { "/api/v1/items/#{question.id}/question_choices" }
    let(:params) { {}.to_json }

    before do
      user.add_role(Role::EDITOR, question)
    end

    it 'returns a 200' do
      post(path, params: params)
      expect(response.status).to eq(200)
    end

    it 'should set the order as the last choice in the current question' do
      post(path, params: params)
      expect(question.reload.question_choices.count).to eq(5)
      # Customizable questions always have 4 question choices to start
      expect(question.question_choices.last.order).to eq(5)
      post(path, params: params)
      expect(question.reload.question_choices.last.order).to eq(6)
      # it creates a question with nil text (to be filled by frontend placeholder)
      expect(question.question_choices.last.text).to be_nil
    end
  end

  describe 'DELETE #destroy' do
    let!(:question) { create(:question_item, question_type: :question_single_choice) }
    let(:path) { "/api/v1/items/#{question.id}/question_choices/#{question.question_choices.first.id}" }

    before do
      user.add_role(Role::EDITOR, question)
    end

    it 'returns a 200' do
      delete(path)
      expect(response.status).to eq(200)
    end

    it 'should remove the question choice' do
      expect {
        delete(path)
      }.to change {
        question.question_choices.count
      }.from(4).to(3)
    end
  end

  describe 'PATCH #update' do
    let!(:question) { create(:question_item, question_type: :question_single_choice) }
    let!(:question_choice) { question.question_choices.first }
    let(:path) { "/api/v1/question_choices/#{question_choice.id}" }
    let(:params) do
      json_api_params(
        'question_choices',
        text: 'New text',
        order: 3,
      )
    end

    before do
      user.add_role(Role::EDITOR, question)
    end

    it 'returns a 200' do
      patch(path, params: params)
      expect(response.status).to eq(200)
    end

    it 'updates the question choice' do
      patch(path, params: params)
      question_choice.reload
      expect(question_choice.text).to eq('New text')
      expect(question_choice.order).to eq(3)
    end
  end
end
