require 'rails_helper'

RSpec.describe TestResultsCollection::CreateOpenResponseCollection, type: :service do
  let(:test_collection) { create(:test_collection) }
  let(:test_results_collection) { create(:test_results_collection, test_collection: test_collection) }
  let(:open_response_item) { test_collection.question_items.question_open.first }
  subject do
    TestResultsCollection::CreateOpenResponseCollection.call(
      parent_collection: test_results_collection,
      question_item: open_response_item,
    )
  end

  it 'creates a TestOpenResponse collection' do
    expect do
      subject
    end.to change(
      Collection::TestOpenResponses, :count
    ).by(1)

    expect(
      open_response_item.test_open_responses_collection,
    ).not_to be_nil
  end

  context 'if it already exists' do
    before do
      # call this an extra time
      TestResultsCollection::CreateOpenResponseCollection.call(
        parent_collection: test_results_collection,
        question_item: open_response_item,
      )
    end

    it 'does not create it' do
      expect { subject }.not_to change(Collection::TestOpenResponses, :count)
    end
  end
end
