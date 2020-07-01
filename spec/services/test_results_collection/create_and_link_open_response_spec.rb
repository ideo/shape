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
  let(:answer_all_questions) do
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
  end

  before do
    Sidekiq::Testing.inline! do
      TestResultsCollection::CreateContent.call(
        test_results_collection: test_results_collection,
      )
    end
    test_collection.reload
  end

  it 'creates open response items for each open response question' do
    expect {
      # Answer all questions
      answer_all_questions
    }.to change(Item::TextItem, :count).by(test_collection.question_items.size)
    # Test if cards are not on top of each other
    # Test positioning of cards
    expect(
      survey_response.question_answers.all? do |answer|
        answer.open_response_item.present?
      end,
    ).to be true
  end

  it 'finds link cards inside the open response collection' do
    answer_all_questions

    test_collection.question_items.question_open.each do |question|
      expect(
        question.test_open_responses_collection.collection_cards.pluck(
          :type,
          :row,
          :col,
        ),
      ).to match_array([['CollectionCard::Link', 0, 0]])
    end
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
