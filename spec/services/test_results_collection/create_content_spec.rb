require 'rails_helper'

RSpec.describe TestResultsCollection::CreateContent, type: :service do
  let(:test_collection) { create(:test_collection, :completed) }
  let(:test_results_collection) { test_collection.test_results_collection }
  let(:idea) { test_collection.idea_items.first }
  let(:idea_in_context) { nil }
  let(:survey_response) { nil }

  before do
    [
      TestResultsCollection::CreateContent,
      TestResultsCollection::CreateItemLink,
      TestResultsCollection::CreateIdeasCollection,
      TestResultsCollection::CreateIdeaCollectionCards,
      TestResultsCollection::CreateOpenResponseCollection,
      TestResultsCollection::CreateResponseGraph,
    ].each do |interactor_klass|
      allow(interactor_klass).to receive(:call!).and_call_original
    end
    allow(TestResultsCollection::CreateCollection).to receive(:call).and_call_original

    # create the TestResultsCollection for the content to appear in
    TestResultsCollection::CreateCollection.call(
      test_collection: test_collection,
    )
    if idea_in_context
      TestResultsCollection::CreateCollection.call(
        test_collection: test_collection,
        idea: idea_in_context,
      )
    end
  end

  subject do
    TestResultsCollection::CreateContent.call!(
      test_results_collection: test_results_collection,
      idea: idea_in_context,
    )
  end

  it 'creates media link in the first position' do
    expect(TestResultsCollection::CreateItemLink).to receive(:call!).with(
      hash_including(
        item: idea,
        identifier: 'first-idea-media',
        # it gets put at order 1 until the TestCollection gets moved to the end
        order: 1,
      ),
    )
    expect(subject).to be_a_success
    # now it should be first
    expect(test_results_collection.collection_cards.first.identifier).to eq 'first-idea-media'
  end

  it 'places the legend in the 3rd spot' do
    expect(subject).to be_a_success
    expect(
      test_results_collection.collection_cards.third.record,
    ).to be_instance_of(Item::LegendItem)
  end

  it 'creates response graphs for all scale questions' do
    test_collection.question_items.scale_questions.each do |question_item|
      expect(TestResultsCollection::CreateResponseGraph).to receive(:call!).with(
        hash_including(
          item: question_item,
        ),
      )
    end
    expect(subject).to be_a_success
  end

  it 'creates open response collections' do
    test_collection.question_items.question_open.each do |question_item|
      expect(TestResultsCollection::CreateOpenResponseCollection).to receive(:call!).with(
        hash_including(
          question_item: question_item,
        ),
      )
    end
    expect(subject).to be_a_success
  end

  it 'moves original test_collection to the end of the results collection' do
    expect(subject).to be_a_success
    expect(
      test_collection
        .test_results_collection
        .collection_cards
        .last
        .collection,
    ).to eq(test_collection)
  end

  it 'creates ideas collection' do
    expect(TestResultsCollection::CreateIdeasCollection).to receive(:call!).with(
      hash_including(
        test_results_collection: test_results_collection,
      ),
    )
    expect(subject).to be_a_success
  end

  it 'calls TestResultsCollection::CreateCollection for the idea' do
    expect(TestResultsCollection::CreateCollection).to receive(:call).with(
      test_collection: test_collection,
      idea: idea,
      created_by: nil,
    )
    expect(subject).to be_a_success
  end

  context 'with multiple ideas' do
    let!(:second_idea_card) do
      create(:collection_card_video, order: 1, parent: test_collection.ideas_collection)
    end
    let(:second_idea) { second_idea_card.item }

    before do
      second_idea.update(content: 'some description')
    end

    it 'calls TestResultsCollection::CreateCollection for each idea' do
      expect(TestResultsCollection::CreateCollection).to receive(:call).with(
        test_collection: test_collection,
        idea: idea,
        created_by: nil,
      )
      expect(TestResultsCollection::CreateCollection).to receive(:call).with(
        test_collection: test_collection,
        idea: second_idea,
        created_by: nil,
      )
      expect(subject).to be_a_success
    end
  end

  context 'with media disabled' do
    it 'does not create media link' do
      test_collection.update(test_show_media: false)
      expect(TestResultsCollection::CreateItemLink).not_to receive(:call!).with(
        hash_including(
          item: idea,
          identifier: 'first-idea-media',
          order: 0,
        ),
      )
      expect(subject).to be_a_success
    end

    it 'archives media link if it was previously added' do
      # Create with media enabled
      TestResultsCollection::CreateContent.call!(
        test_results_collection: test_results_collection,
      )
      media_link = test_results_collection.collection_cards
                                          .identifier('first-idea-media')
                                          .first
      expect(media_link.archived?).to be false

      # Disable media
      test_collection.update(test_show_media: false)
      # Reload so it gets updated setting
      test_results_collection.test_collection.reload

      expect(subject).to be_a_success
      expect(media_link.reload.archived?).to be true
    end
  end

  context 'with idea in the context' do
    let(:idea_in_context) { idea }
    let(:test_results_collection) { idea.test_results_collection }

    it 'links idea media + description inline' do
      expect(test_results_collection).to be_instance_of(Collection::TestResultsCollection)
      expect(TestResultsCollection::CreateIdeaCollectionCards).to receive(:call!).with(
        hash_including(
          parent_collection: test_results_collection,
          idea_item: idea,
        ),
      )
      expect(subject).to be_a_success
      cards = idea.test_results_collection.collection_cards
      expect(
        cards.identifier('idea-1-media').first.record,
      ).to be_instance_of(Item::VideoItem)
      expect(
        cards.identifier('idea-1-description').first.record,
      ).to be_instance_of(Item::TextItem)
    end

    it 'creates media link in the first position' do
      expect(TestResultsCollection::CreateItemLink).to receive(:call!).with(
        hash_including(
          item: idea,
          width: 1,
          height: 2,
          identifier: 'first-idea-media',
        ),
      )
      expect(subject).to be_a_success
      # now it should be first
      expect(test_results_collection.collection_cards.first.identifier).to eq 'first-idea-media'
    end

    it 'does not call TestResultsCollection::CreateCollection on any subcollections' do
      expect(TestResultsCollection::CreateCollection).not_to receive(:call)
      expect(subject).to be_a_success
    end
  end

  context 'with survey response in the context' do
    let!(:survey_response) { create(:survey_response, test_collection: test_collection) }
    let!(:test_results_collection) do
      create(:test_results_collection, test_collection: test_collection, survey_response: survey_response)
    end

    it 'does not call TestResultsCollection::CreateCollection on any subcollections' do
      expect(TestResultsCollection::CreateCollection).not_to receive(:call)
      expect(subject).to be_a_success
    end
  end

  context 'for in-collection test' do
    let(:test_collection) do
      create(:test_collection, :completed, collection_to_test: create(:collection))
    end
    # these default questions will get hidden
    let(:hidden_scale_item) do
      test_collection.collection_cards.hidden.first.item
    end
    let(:hidden_open_response_item) do
      test_collection.collection_cards.hidden.last.item
    end
    let(:visible_scale_items) do
      test_collection
        .question_items
        .scale_questions
        .joins(:parent_collection_card)
        .where(CollectionCard.arel_table[:hidden].eq(false))
    end
    before do
      test_collection.hide_or_show_section_questions!
    end

    it 'does not generate content for hidden cards' do
      visible_scale_items.each do |question_item|
        expect(TestResultsCollection::CreateResponseGraph).to receive(:call!).with(
          hash_including(
            item: question_item,
          ),
        )
      end
      expect(TestResultsCollection::CreateResponseGraph).not_to receive(:call!).with(
        hash_including(
          item: hidden_scale_item,
        ),
      )
      expect(TestResultsCollection::CreateOpenResponseCollection).not_to receive(:call!).with(
        hash_including(
          question_item: hidden_open_response_item,
        ),
      )
      expect(subject).to be_a_success
    end
  end

  context 'with more scaled questions' do
    let!(:scale_questions) { create_list(:question_item, 2, parent_collection: test_collection) }
    let(:legend_item) { test_results_collection.legend_item }

    it 'should create all test results cards, correctly ordered' do
      expect(subject).to be_a_success
      # legend item should be in the 3rd spot (order == 2)
      expect(legend_item.parent_collection_card.order).to eq 2
      results_cards = test_results_collection.collection_cards.reload

      expect(
        results_cards.map { |card| card.record.class.name },
      ).to eq(
        [
          'Item::VideoItem',
          'Item::DataItem',
          'Item::LegendItem',
          # ideas collection
          'Collection',
          # all the default questions
          'Item::DataItem',
          'Item::DataItem',
          'Item::DataItem',
          'Collection::TestOpenResponses',
          'Collection::TestOpenResponses',
          # 2 additional scaled
          'Item::DataItem',
          'Item::DataItem',
          # all responses
          'Collection',
          # idea results
          'Collection::TestResultsCollection',
          # original test collection (feedback design)
          'Collection::TestCollection',
        ],
      )
      expect(
        results_cards.map(&:order),
      ).to eq(0.upto(13).to_a)
    end
  end
end
