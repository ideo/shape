require 'rails_helper'

RSpec.describe TestResultsCollection::CreateContent, type: :service do
  let(:test_collection) { create(:test_collection, :completed) }
  before do
    TestResultsCollection::CreateCollection.call(
      test_collection: test_collection,
    )
  end
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
  end
  let(:test_results_collection) { test_collection.test_results_collection }
  let(:idea) { test_collection.idea_items.first }
  let(:idea_in_context) { nil }
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
        order: 0,
      ),
    )
    expect(subject).to be_a_success
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
          item: question_item,
        ),
      )
    end
    expect(subject).to be_a_success
  end

  it 'creates ideas collection' do
    expect(TestResultsCollection::CreateIdeasCollection).to receive(:call!).with(
      hash_including(
        test_results_collection: test_results_collection,
      ),
    )
    expect(subject).to be_a_success
  end

  context 'with idea in the context' do
    let!(:idea_in_context) { idea }
    before do
      TestResultsCollection::CreateCollection.call(
        test_collection: test_collection,
        idea: idea,
      )
    end

    it 'links idea media + description inline' do
      expect(idea.test_results_collection).to be_instance_of(Collection::TestResultsCollection)
      expect(TestResultsCollection::CreateIdeaCollectionCards).to receive(:call!).with(
        hash_including(
          parent_collection: idea.test_results_collection,
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

    it 'links idea description inline' do
      expect(subject).to be_a_success
    end

    it 'does not create ideas collection' do
      expect(subject).to be_a_success
    end
  end
end
