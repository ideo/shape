require 'rails_helper'

RSpec.describe QuestionAnswer, type: :model do
  context 'associations' do
    it { should belong_to(:survey_response) }
    it { should belong_to(:question) }
  end

  describe 'callbacks' do
    describe '#update_survey_response' do
      let!(:survey_response) { create(:survey_response) }
      let(:question_answer) do
        build(:question_answer,
              survey_response: survey_response,
              question: survey_response.question_items.first)
      end

      it 'on save, calls question_answer_created_or_destroyed' do
        expect(survey_response).to receive(:question_answer_created_or_destroyed)
        question_answer.save
      end

      it 'on destroy, calls question_answer_created_or_destroyed' do
        expect(survey_response).to receive(:question_answer_created_or_destroyed).twice
        question_answer.save
        question_answer.destroy
      end
    end
  end
end
