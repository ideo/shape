require 'rails_helper'

RSpec.describe TestResultsCollection::CreateCollection, type: :service do
  let(:test_collection) { create(:test_collection, :completed) }
  let(:test_results_collection) { test_collection.test_results_collection }
  let(:idea) { nil }
  before do
    allow(TestResultsCollection::CreateContent).to receive(:call!).and_call_original
  end
  subject do
    TestResultsCollection::CreateCollection.call(
      test_collection: test_collection,
      idea: idea,
    )
  end

  it 'creates the TestResultsCollection' do
    expect {
      subject
    }.to change(Collection::TestResultsCollection, :count).by(1)
  end

  it 'calls TestResultsCollection::CreateContentWorker' do
    expect(TestResultsCollection::CreateContentWorker).to receive(:perform_async).with(
      # newly created collection id
      anything,
      test_collection.created_by.id,
    )
    expect(subject).to be_a_success
  end

  context 'if idea provided' do
    before do
      # Create primary test results collection
      TestResultsCollection::CreateCollection.call(
        test_collection: test_collection,
      )
      test_collection.reload
    end
    let!(:idea) { test_collection.idea_items.first }

    it 'creates results collection linked to idea' do
      expect(subject).to be_a_success
      expect(idea.test_results_collection).to be_instance_of(Collection::TestResultsCollection)
    end
  end
end
