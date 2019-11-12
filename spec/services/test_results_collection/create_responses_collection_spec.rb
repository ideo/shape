require 'rails_helper'

RSpec.describe TestResultsCollection::CreateResponsesCollection, type: :service do
  let(:test_collection) { create(:test_collection, :completed, :with_responses, :with_test_audience, num_responses: 5) }
  let(:test_results_collection) { create(:test_results_collection, test_collection: test_collection) }
  let(:created_by) { create(:user) }
  let(:idea) { nil }

  subject do
    TestResultsCollection::CreateResponsesCollection.call(
      test_collection: test_collection,
      test_results_collection: test_results_collection,
      survey_responses: test_collection.survey_responses,
      test_audiences: test_collection.test_audiences,
      created_by: created_by,
      idea: idea
    )
  end

  it 'creates an all_responses collection in the TRC' do
    expect(subject).to be_a_success
    expect(test_results_collection.collection_cards.where(
      identifier: CardIdentifier.call([test_results_collection], 'Responses')
    ).count).to be 1
  end

  it 'should set the name to "All Responses"' do
    expect(subject.all_responses_collection.name).to eq 'Responses'
  end

  it 'should create alias collections for each respondent' do
    alias_collections = subject.all_responses_collection.collections.where.not(
      survey_response_id: nil,
    )
    expect(alias_collections.count).to eq 5
  end

  it 'should name alias collections for each respondent' do
    alias_collection = subject.all_responses_collection.collections.where.not(
      survey_response_id: nil,
    ).first
    expect(alias_collection.name).to eq "#{test_collection.name} - #{test_collection.survey_responses.first.respondent_alias}"
  end

  it 'should create audience TRCs for each audience' do
    audience_collections = subject.all_responses_collection.collections.where(
      survey_response_id: nil,
    )
    expect(audience_collections.count).to eq 1
  end

  it 'should name audience TRCs with audience name' do
    audience_collection = subject.all_responses_collection.collections.where(
      survey_response_id: nil,
    ).first
    expect(audience_collection.name).to eq "#{test_collection.name} - #{test_collection.test_audiences.first.audience_name}"
  end

  # context 'with an idea' do
  #   let!(:idea) { test_collection.idea_items.first }

  #   it 'should link the TSRC responses collection into the current TRC' do
  #     expect(subject.all_responses_collection).to exist
  #   end
  # end
end
