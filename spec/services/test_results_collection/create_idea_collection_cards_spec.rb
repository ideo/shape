require 'rails_helper'

RSpec.describe TestResultsCollection::CreateIdeaCollectionCards, type: :service do
  let(:test_collection) { create(:test_collection, :completed) }
  before do
    # Stub out create content so the ideas collection isn't already created
    allow(TestResultsCollection::CreateContent).to receive(:call!)
    TestResultsCollection::CreateCollection.call(test_collection: test_collection)
    allow(TestResultsCollection::CreateIdeaCollectionCards).to receive(:call!).and_call_original
  end
  let(:test_results_collection) { test_collection.test_results_collection }
  let(:idea) { test_collection.idea_items.first }
  subject do
    TestResultsCollection::CreateIdeaCollectionCards.call(
      parent_collection: test_results_collection,
      idea_item: idea,
      num_idea: 1,
    )
  end
  let(:media_link_card) do
    test_results_collection.link_collection_cards.identifier('idea-1-media').first
  end
  let(:description_card) do
    test_results_collection.primary_collection_cards.identifier('idea-1-description').first
  end

  it 'creates media link' do
    expect {
      subject
    }.to change(CollectionCard::Link, :count).by(1)
    expect(subject).to be_a_success
    expect(media_link_card.record).to eq(idea)
  end

  it 'creates description card' do
    expect {
      subject
    }.to change(Item::TextItem, :count).by(1)
    expect(subject).to be_a_success
    expect(description_card.record).to be_instance_of(Item::TextItem)
    expect(description_card.record.content).to include(idea.name)
    expect(description_card.record.content).to include(idea.content)
  end

  context 'if cards exist' do
    before do
      TestResultsCollection::CreateIdeaCollectionCards.call(
        parent_collection: test_results_collection,
        idea_item: idea,
        num_idea: 1,
      )
    end

    it 'does not create media link' do
      expect {
        subject
      }.not_to change(CollectionCard::Link, :count)
    end

    it 'does not create description card' do
      expect {
        subject
      }.not_to change(Item::TextItem, :count)
    end
  end
end
