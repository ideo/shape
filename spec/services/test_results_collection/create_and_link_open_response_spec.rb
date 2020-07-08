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
  let(:create_and_link_open_responses) do
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
      survey_response.update(status: 'completed')
    end

  before do
    test_collection.question_items.question_open.map do |question_item|
      # simulate creating all the open response collections
      collection = create(
        :collection_card_board_collection,
        identifier: CardIdentifier.call(test_results_collection, question_item, 'OpenResponses'),
      ).collection
      collection.becomes(Collection::TestOpenResponses).update(
        type: 'Collection::TestOpenResponses',
        question_item_id: question_item.id,
      )
    end

    test_collection.idea_items.map do |idea_item|
      idea_results_collection = create(
        :collection_card_board_collection,
        identifier: CardIdentifier.call(test_results_collection, idea_item),
      ).collection

      test_collection.question_items.question_open.map do |question_item|
        create(
          :collection_card_board_collection,
          identifier: CardIdentifier.call(idea_results_collection, question_item, 'OpenResponses'),
        ).collection
      end
    end
    test_collection.reload
  end

  it 'creates open response items for each open response question' do
    expect {
      # Answer all questions
      create_and_link_open_responses
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
    create_and_link_open_responses

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
    it 'does not create open response items' do
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

  context "QuestionAnswer callbacks" do
    let(:question_answer) { survey_response.question_answers.first.reload }
    before { create_and_link_open_responses }

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

      context 'when open response item is not there' do
        before do
          question_answer.open_response_item = nil
          question_answer.save
          question_answer.reload
        end

        it 'creates a new open response item' do
          question_answer.reload.update(
            answer_text: 'What a jolly prototype'
          )
          expect(question_answer.reload.open_response_item.present?).to be true
          expect(question_answer.open_response_item.content).to include(
            'What a jolly prototype'
          )
        end
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
