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

  context 'updating roles' do
    context 'with roles on test collection' do
      let(:editor) { create(:user) }
      before do
        test_collection.unanchor_and_inherit_roles_from_anchor!
        editor.add_role(Role::EDITOR, test_collection)
      end

      it 'moves roles to results collection' do
        role = test_collection.roles.first
        expect(subject).to be_a_success

        test_collection.reload
        expect(test_results_collection.roles).to eq([role])
        expect(test_collection.roles.reload).to be_empty
        expect(test_collection.roles_anchor).to eq(test_results_collection)
      end

      it 'correctly anchors the children (items and ideas collection)' do
        expect(subject).to be_a_success
        expect(
          test_collection.children.all? { |child| child.roles_anchor == test_results_collection },
        ).to be true
      end
    end

    context 'with test collection anchored to another collection' do
      let(:parent) { test_collection.parent }

      it 'keeps everything anchored to the original roles anchor' do
        expect(test_collection.roles_anchor).to eq parent
        expect(subject).to be_a_success
        collections = [test_results_collection] + [test_collection] + test_collection.children
        expect(collections.all? { |c| c.roles_anchor == parent }).to be true
      end
    end
  end
end
