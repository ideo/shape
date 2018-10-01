require 'rails_helper'

RSpec.describe QuestionAnswer, type: :model do
  context 'associations' do
    it { should belong_to(:survey_response) }
    it { should belong_to(:question) }
  end

  describe 'callbacks' do
    let(:user) { create(:user) }
    let(:test_collection) { create(:test_collection) }
    let!(:survey_response) { create(:survey_response, test_collection: test_collection) }
    let(:question) { survey_response.question_items.first }
    let(:question_answer) do
      build(:question_answer,
            survey_response: survey_response,
            question: question)
    end

    before do
      test_collection.question_items.each do |question|
        question.update(
          question_type: Item::QuestionItem.question_types[:question_open],
        )
      end
      test_collection
        .launch_test!(initiated_by: user)
    end

    describe '#update_survey_response' do
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

    context 'incomplete response' do
      describe '#update_open_response_item' do
        it 'does not create open response item' do
          expect {
            question_answer.save
          }.not_to change(Item::TextItem, :count)
        end
      end
    end

    context 'completed response' do
      let!(:question_answers) do
        survey_response.question_items.map do |question|
          create(:question_answer,
                 survey_response: survey_response,
                 question: question)
        end
      end
      let(:question_answer) { question_answers.first.reload }

      before do
        expect(survey_response.reload.completed?).to be true
      end

      describe '#update_open_response_item' do
        it 'creates open response item if it does not exist' do
          expect(question_answer.open_response_item.present?).to be true
        end

        it 'updates open response item with updated answer' do
          expect(question_answer.open_response_item.plain_content).not_to eq(
            'What a jolly prototype',
          )
          question_answer.update(
            answer_text: 'What a jolly prototype',
          )
          expect(question_answer.open_response_item.reload.plain_content).to eq(
            'What a jolly prototype',
          )
        end
      end

      describe '#destroy_open_response_item_and_card' do
        it 'destroys open response item' do
          item = question_answer.open_response_item
          expect(item.destroyed?).to be false
          question_answer.destroy
          expect(item.destroyed?).to be true
        end
      end
    end
  end
end
