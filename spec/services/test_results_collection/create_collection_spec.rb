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
      anything, # newly created collection id
      test_collection.created_by.id,
      nil, # idea_id
    )
    expect(subject).to be_a_success
  end

  it 'changes the test collection name to feedback design' do
    prev_name = test_collection.name
    expect(subject).to be_a_success
    expect(test_collection.reload.name).to eq(
      prev_name + Collection::TestCollection::FEEDBACK_DESIGN_SUFFIX,
    )
  end

  it 'moves test collection to be inside results collection' do
    expect(subject).to be_a_success
    expect(test_results_collection.collections).to include(test_collection)
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

  context 'with roles on test collection' do
    let(:editor) { create(:user) }
    before do
      test_collection.update_column(:roles_anchor_collection_id, nil)
    end
    let!(:role) { editor.add_role(Role::EDITOR, test_collection) }
    before do
      test_collection.roles.reload
    end

    it 'moves roles to results collection' do
      expect(subject).to be_a_success
      expect(test_results_collection.roles).to eq([role])
      expect(test_collection.roles.reload).to be_empty
      expect(test_collection.roles_anchor).to eq(test_results_collection)
    end
  end
end
