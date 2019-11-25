require 'rails_helper'

RSpec.describe TestResultsCollection::CreateAndLinkOpenResponse, type: :service do
  let!(:test_collection) { create(:test_collection, :launched, :open_response_questions) }
  let(:test_results_collection) { test_collection.test_results_collection }
  let!(:survey_response) { create(:survey_response, test_collection: test_collection) }
  let!(:alias_open_responses_collection) do
    create(
      :collection_card_collection,
      identifier: CardIdentifier.call(survey_response, 'OpenResponses'),
    ).collection
  end

  before do
    test_collection.question_items.question_open.map do |question_item|
      # simulate this
      create(:test_open_responses_collection, question_item: question_item)
    end
    test_collection.reload
  end

  it 'creates open response items for each open response question' do
    expect {
      # Answer all questions
      test_collection.question_items.map do |question|
        question_answer = create(
          :question_answer,
          survey_response: survey_response,
          question: question,
        )
        TestResultsCollection::CreateAndLinkOpenResponse.call(
          test_collection: test_collection,
          question_answer: question_answer,
        )
      end
    }.to change(Item::TextItem, :count).by(test_collection.question_items.size)
    expect(
      survey_response.question_answers.all? do |answer|
        answer.open_response_item.present?
      end,
    ).to be true
  end

  context 'when answer_text is blank' do
    it 'does not create open resonse items' do
      expect {
        question = test_collection.question_items.first
        question_answer = create(
          :question_answer,
          survey_response: survey_response,
          question: question,
          answer_text: '',
        )
        TestResultsCollection::CreateAndLinkOpenResponse.call(
          test_collection: test_collection,
          question_answer: question_answer,
        )
      }.to change(Item::TextItem, :count).by(0)
    end
  end
end
