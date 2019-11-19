require 'rails_helper'

RSpec.describe QuestionAnswer, type: :model do
  let(:user) { create(:user) }
  let!(:test_collection) { create(:test_collection, :open_response_questions, :completed) }
  before { test_collection.launch!(initiated_by: user) }
  let(:survey_response) { create(:survey_response, test_collection: test_collection) }
  let(:question) { survey_response.question_items.first }

  context 'associations' do
    it { should belong_to(:survey_response) }
    it { should belong_to(:question) }
    it { should belong_to(:idea) }
  end

  describe 'validations' do
    let(:question_answer) do
      build(:question_answer,
            :unanswered,
            survey_response: survey_response,
            question: question)
    end

    describe 'unique survey_response, question_id, idea_id' do
      let(:question_answer2) do
        build(:question_answer,
              :unanswered,
              survey_response: survey_response,
              question: question)
      end

      it 'validates uniqueness' do
        expect(question_answer.save).to be true
        expect(question_answer2.save).to be false
      end

      context 'with multiple ideas' do
        it 'validates uniqueness' do
          expect(question_answer.update(idea_id: 1)).to be true
          # this won't work
          expect(question_answer2.update(idea_id: 1)).to be false
          # but unique idea will
          expect(question_answer2.update(idea_id: 2)).to be true
        end
      end
    end

    describe 'answer_number presence' do
      context 'scale question' do
        before do
          question.update(question_type: :question_clarity)
        end

        it 'is valid with answer_number' do
          expect(question_answer.answer_number).to be_nil
          expect(question_answer.valid?).to be false
          expect(question_answer.errors[:answer_number]).not_to be_empty
        end

        it 'is invalid without answer_number' do
          question_answer.answer_number = 2
          expect(question_answer.valid?).to be true
          expect(question_answer.errors[:answer_number]).to be_empty
        end
      end

      context 'open response question' do
        before do
          question.update(question_type: :question_open)
        end

        it 'is valid without answer_number' do
          expect(question_answer.answer_number).to be_nil
          expect(question_answer.valid?).to be true
          expect(question_answer.errors[:answer_number]).to be_empty
        end
      end
    end
  end

  describe 'callbacks' do
    let(:question_answer) do
      build(:question_answer,
            survey_response: survey_response,
            question: question)
    end
    before do
      test_collection.question_items.each do |question|
        question.update(
          question_type: Item::QuestionItem.question_types[:question_open],
          content: 'some question?',
        )
      end
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

    context 'complete after test closed' do
      let(:survey_response) { create(:survey_response, :fully_answered, status: :in_progress, test_collection: test_collection) }
      before do
        test_collection.close!
      end

      describe 'within allowable window' do
        it 'marks the survey_response as completed_late' do
          survey_response.question_answer_created_or_destroyed
          expect(survey_response.reload.status).to eq 'completed_late'
        end
      end
    end

    context 'completed response' do
      # NOTE: this test is also effectively testing some of the underlying services e.g.
      # TestResultsCollection::CreateAndLinkOpenResponse
      let!(:test_collection) { create(:test_collection, :open_response_questions, :launched) }
      let!(:survey_response) { create(:survey_response, :fully_answered, test_collection: test_collection) }
      let(:question_answer) { survey_response.question_answers.first.reload }

      before do
        TestResultsCollection::CreateContent.call(
          test_results_collection: test_collection.test_results_collection,
        )
        expect(survey_response.reload.completed?).to be true
      end

      describe '#update_open_response_item' do
        it 'creates open response item if it does not exist' do
          expect(question_answer.open_response_item.present?).to be true
        end

        it 'updates open response item with updated answer' do
          expect(question_answer.open_response_item.plain_content).not_to include(
            'What a jolly prototype',
          )
          question_answer.update(
            answer_text: 'What a jolly prototype',
          )
          expect(question_answer.open_response_item.reload.plain_content).to include(
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
