require 'rails_helper'

RSpec.describe TestCollection::AnswerSearchKey, type: :service do
  let(:test_collection) { create(:test_collection, :completed) }
  let(:org_id) { test_collection.organization_id }
  let(:test_id) { test_collection.id }
  let(:question_choice_id) { nil }
  let(:answer_number) { nil }
  let(:audience_id) { nil }
  let(:question_type) { nil }
  let(:dont_include_test_answer_wrapper) { nil }
  subject do
    TestCollection::AnswerSearchKey.new(
      question: question,
      question_type: question_type,
      question_choice_id: question_choice_id,
      answer_number: answer_number,
      audience_id: audience_id,
      dont_include_test_answer_wrapper: dont_include_test_answer_wrapper,
    )
  end

  context 'with scale question answer' do
    let(:question) { test_collection.question_items.scale_questions.sample }
    let(:answer_number) { 2 }

    it 'returns question key' do
      expect(subject.for_test(test_id)).to eq(
        "test_answer(test_#{test_id}_question_#{question.id}_answer_2)",
      )
    end

    it 'returns org-wide key' do
      expect(subject.for_organization(org_id)).to eq(
        "test_answer(organization_#{org_id}_#{question.question_type}_answer_2)",
      )
    end

    context 'with audience' do
      let(:audience_id) { 18 }

      it 'returns key with audience' do
        expect(subject.for_test(test_id)).to eq(
          "test_answer(test_#{test_id}_question_#{question.id}_answer_2_audience_18)",
        )
      end
    end

    context 'with idea' do
      it 'returns question key' do
        expect(subject.for_test(test_id, 5)).to eq(
          "test_answer(test_#{test_id}_idea_5_question_#{question.id}_answer_2)",
        )
      end
    end

    context 'with dont_include_test_answer_wrapper true' do
      let!(:dont_include_test_answer_wrapper) { true }

      it 'just returns key' do
        expect(subject.for_test(test_id)).to eq(
          "test_#{test_id}_question_#{question.id}_answer_2",
        )
      end
    end
  end

  context 'with multiple choice question answer' do
    let(:question) { create(:question_item, question_type: :question_single_choice, parent_collection: test_collection) }
    let(:question_choice_id) { question.question_choices.sample.id }

    it 'returns question key' do
      expect(subject.for_test(test_id)).to eq(
        "test_answer(test_#{test_id}_question_#{question.id}_answer_#{question_choice_id})",
      )
    end

    it 'returns org-wide key' do
      expect(subject.for_organization(org_id)).to eq(
        "test_answer(organization_#{org_id}_#{question.question_type}_answer_#{question_choice_id})",
      )
    end

    context 'with audience' do
      let(:audience_id) { 18 }

      it 'returns key with audience' do
        expect(subject.for_test(test_id)).to eq(
          "test_answer(test_#{test_id}_question_#{question.id}_answer_#{question_choice_id}_audience_18)",
        )
      end
    end

    context 'with idea' do
      it 'returns key' do
        expect(subject.for_test(test_id, 7)).to eq(
          "test_answer(test_#{test_id}_idea_7_question_#{question.id}_answer_#{question_choice_id})",
        )
      end
    end
  end

  context 'with empty question and question type' do
    let!(:question) { nil }
    let(:question_type) { :question_useful }
    let(:answer_number) { 1 }

    it 'returns org-wide key' do
      expect(subject.for_organization(org_id)).to eq(
        "test_answer(organization_#{org_id}_#{question_type}_answer_1)",
      )
    end
  end
end
