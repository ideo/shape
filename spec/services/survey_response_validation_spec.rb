require 'rails_helper'

describe SurveyResponseValidation, type: :service do
  describe '#call' do
    let(:test_collection) { create(:test_collection, :completed) }
    let(:survey_response) { create(:survey_response, test_collection: test_collection) }
    subject { SurveyResponseValidation.new(survey_response) }

    context 'with single idea' do
      context 'no questions answered' do
        it 'returns false' do
          expect(subject.call).to be false
        end
      end

      context 'some questions answered' do
        let!(:question_answer) do
          question_id, idea_id = subject.answerable_ids.first
          create(:question_answer,
                 survey_response: survey_response,
                 question_id: question_id,
                 idea_id: idea_id)
        end

        it 'returns false' do
          expect(subject.call).to be false
        end
      end

      context 'all questions answered' do
        let!(:question_answers) do
          subject.answerable_ids.map do |question_id, idea_id|
            create(:question_answer,
                   survey_response: survey_response,
                   question_id: question_id,
                   idea_id: idea_id)
          end
        end

        it 'returns true' do
          # 1 intro, 4 idea questions, 1 outro
          expect(subject.answerable_ids.count).to eq 6
          expect(subject.call).to be true
        end
      end
    end

    context 'with multiple ideas' do
      let(:test_collection) { create(:test_collection, :two_ideas, :completed) }

      context 'no questions answered' do
        it 'returns false' do
          expect(subject.call).to be false
        end
      end

      context 'some questions answered' do
        let!(:question_answer) do
          question_id, idea_id = subject.answerable_ids.first
          create(:question_answer,
                 survey_response: survey_response,
                 question_id: question_id,
                 idea_id: idea_id)
        end

        it 'returns false' do
          expect(subject.call).to be false
        end
      end

      context 'all questions answered' do
        let!(:question_answers) do
          subject.answerable_ids.map do |question_id, idea_id|
            create(:question_answer,
                   survey_response: survey_response,
                   question_id: question_id,
                   idea_id: idea_id)
          end
        end

        it 'returns true' do
          # 1 intro, 4 idea questions x2, 1 outro
          expect(subject.answerable_ids.count).to eq 10
          expect(subject.call).to be true
        end
      end

      context 'switching to in-collection test' do
        before do
          test_collection.update(collection_to_test: create(:collection))
          test_collection.hide_or_show_section_questions!
        end

        context 'all questions answered' do
          let!(:question_answers) do
            subject.answerable_ids.map do |question_id, idea_id|
              create(:question_answer,
                     survey_response: survey_response,
                     question_id: question_id,
                     idea_id: idea_id)
            end
          end

          it 'returns true' do
            # should just be the 4 idea questions, and only once
            expect(subject.answerable_ids.count).to eq 4
            expect(subject.call).to be true
          end
        end
      end
    end
  end
end
