require 'rails_helper'

RSpec.describe TestResultsCollection::CreateIdeasCollection, type: :service do
  let(:test_collection) { create(:test_collection, :completed) }
  before do
    # Stub out create content so the ideas collection isn't already created
    allow(TestResultsCollection::CreateContent).to receive(:call!).and_return(
      double(success?: true),
    )
    TestResultsCollection::CreateCollection.call(test_collection: test_collection)
    allow(TestResultsCollection::CreateIdeaCollectionCards).to receive(:call!).and_call_original
  end
  let(:test_results_collection) { test_collection.test_results_collection }
  let(:idea) { nil }
  subject do
    TestResultsCollection::CreateIdeasCollection.call(
      test_results_collection: test_results_collection,
    )
  end

  it 'creates collection' do
    expect { subject }.to change(Collection, :count).by(1)
    expect(subject.ideas_collection_card.record.name).to eq(
      test_collection.base_name + ' - Ideas',
    )
  end

  it 'adds identifier' do
    expect(subject.ideas_collection_card.identifier).to eq('ideas-collection')
  end

  it 'creates cards for each idea' do
    test_collection.idea_items.each do |idea|
      expect(TestResultsCollection::CreateIdeaCollectionCards).to receive(:call!).with(
        hash_including(
          idea_item: idea,
        ),
      )
    end
    expect(subject).to be_a_success
  end

  context 'if collection exists' do
    before do
      TestResultsCollection::CreateIdeasCollection.call(
        test_results_collection: test_results_collection,
      )
    end

    it 'does not create collection' do
      expect { subject }.not_to change(Collection, :count)
    end
  end
end
