require 'rails_helper'

RSpec.describe TestCollection::ResponseSearchKeys, type: :service do
  let(:test_collection) { create(:test_collection, :completed) }
  let!(:idea_2) { create(:question_item, question_type: :question_idea, parent_collection: test_collection.ideas_collection) }
  let!(:test_audience) { create(:test_audience, test_collection: test_collection) }
  let(:survey_response) { create(:survey_response, test_collection: test_collection, test_audience: test_audience) }
  let(:non_repeating_questions) { test_collection.non_repeating_question_items.graphable_questions }
  let(:ideas_questions) { test_collection.ideas_question_items.graphable_questions }
  let(:graphable_answers) { survey_response.question_answers.joins(:question).merge(Item::QuestionItem.graphable_questions) }
  let(:idea_ids) { test_collection.idea_items.pluck(:id) }
  before do
    non_repeating_questions.each do |question|
      create(:question_answer, question: question, survey_response: survey_response)
    end
    ideas_questions.each do |question|
      idea_ids.each do |idea_id|
        create(
          :question_answer,
          question: question,
          survey_response: survey_response,
          idea_id: idea_id,
        )
      end
    end
  end
  let(:expected_keys_without_audience) do
    keys = []
    graphable_answers.map do |answer|
      if answer.question_choices_customizable?
        answer_vals = answer.selected_choice_ids
        org_question_type = "question_#{answer.question.question_id}"
      else
        answer_vals = [answer.answer_number]
        org_question_type = answer.question.question_type
      end
      answer_vals.map do |val|
        if answer.idea_id.present?
          keys << "test_#{test_collection.id}_idea_#{answer.idea_id}_question_#{answer.question.id}_answer_#{val}"
        else
          keys << "test_#{test_collection.id}_question_#{answer.question.id}_answer_#{val}"
        end
        keys << "organization_#{test_collection.organization_id}_#{org_question_type}_answer_#{val}"
      end
    end
    keys
  end
  let(:expected_keys) do
    expected_keys_without_audience +
      expected_keys_without_audience.map do |key|
        "#{key}_audience_#{test_audience.id}"
      end
  end
  subject do
    TestCollection::ResponseSearchKeys.call(
      survey_response: survey_response,
    )
  end

  describe '#call' do
    it 'returns keys for all graphable questions' do
      expect(subject).to match_array(expected_keys)
    end
  end
end
