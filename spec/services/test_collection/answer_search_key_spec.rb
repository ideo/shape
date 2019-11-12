require 'rails_helper'

RSpec.describe TestCollection::AnswerSearchKey, type: :service do
  let(:test_collection) { create(:test_collection, :completed) }
  let(:org_id) { test_collection.organization_id }
  let(:test_id) { test_collection.id }
  let(:answer) { nil }
  let(:test_audience_id) { nil }
  subject do
    TestCollection::AnswerSearchKey.new(
      answer, test_audience_id
    )
  end

  context 'with scale question answer' do
    let(:question) { test_collection.question_items.scale_questions.sample }
    let(:answer) { QuestionAnswer.new(answer_number: 2, question: question) }

    it 'returns question key' do
      expect(subject.for_test(test_id)).to eq(
        "test_#{test_id}_question_#{question.id}_answer_2",
      )
    end

    it 'returns org-wide key' do
      expect(subject.for_organization(org_id)).to eq(
        "organization_#{org_id}_question_#{question.question_type}_answer_2",
      )
    end

    context 'with audience' do
      let(:test_audience_id) { 18 }

      it 'returns key with audience' do
        expect(subject.for_test(test_id)).to eq(
          "test_#{test_id}_question_#{question.id}_answer_2_audience_18",
        )
      end
    end

    context 'with idea' do
      it 'returns question key' do
        expect(subject.for_test(test_id, 5)).to eq(
          "test_#{test_id}_idea_5_question_#{question.id}_answer_2",
        )
      end
    end
  end

  context 'with multiple choice question answer' do
    let(:question) { create(:question_item, question_type: :question_single_choice, parent_collection: test_collection) }
    let(:question_choice) { question.question_choice.sample }
    let(:answer) { QuestionAnswer.new(question_choice: question_choice, question: question) }

    it 'returns question key' do
      expect(subject.for_test(test_id)).to eq(
        "test_#{test_id}_question_#{question.id}_answer_#{question_choice.id}",
      )
    end

    it 'returns org-wide key' do
      expect(subject.for_organization(org_id)).to eq(
        "organization_#{org_id}_question_#{question.question_type}_answer_2",
      )
    end

    context 'with audience' do
      let(:test_audience_id) { 18 }

      it 'returns key with audience' do
        expect(subject.for_test(test_id)).to eq(
          "test_#{test_id}_question_#{question.id}_answer_#{question_choice.id}_audience_18",
        )
      end
    end

    context 'with idea' do
      it 'returns key' do
        expect(subject.for_test(test_id, 7)).to eq(
          "test_#{test_id}_idea_7_question_#{question.id}_answer_#{question_choice.id}",
        )
      end
    end
  end
end
