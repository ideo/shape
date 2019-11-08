require 'rails_helper'

RSpec.describe TestCollection::CreateResultsCollections, type: :service do
  let(:test_collection) { create(:test_collection, :completed) }
  before do
    allow(TestResultsCollection::CreateCollection).to receive(:call).and_call_original
  end
  subject do
    TestCollection::CreateResultsCollections.call(
      test_collection: test_collection,
    )
  end

  it 'calls TestResultsCollection::CreateCollection' do
    expect(TestResultsCollection::CreateCollection).to receive(:call).with(
      test_collection: test_collection,
      created_by: test_collection.created_by,
    )
    expect(subject).to be_a_success
  end

  it 'calls TestResultsCollection::CreateCollection for each idea' do
    test_collection.idea_items.each do |idea|
      expect(TestResultsCollection::CreateCollection).to receive(:call).with(
        test_collection: test_collection,
        idea: idea,
        created_by: test_collection.created_by,
      )
    end
    expect(subject).to be_a_success
  end

  it 'moves test design collection to the end of the collection' do
    expect(subject).to be_a_success
    expect(
      test_collection
        .test_results_collection
        .collection_cards
        .last
        .collection,
    ).to eq(test_collection)
  end
end
