require 'rails_helper'

RSpec.describe TestResultsCollection::CreateResponsesCollection, type: :service do
  let(:num_responses) { 2 }
  let(:test_collection) { create(:test_collection, :completed, :with_responses, :with_test_audience, num_responses: num_responses) }
  let(:test_results_collection) { create(:test_results_collection, test_collection: test_collection) }
  let(:created_by) { create(:user) }
  let(:idea) { nil }
  let(:link_sharing) { nil }

  before do
    # ignore link sharing
    test_collection.link_sharing_audience.closed! unless link_sharing
    test_collection.reload
  end

  subject do
    TestResultsCollection::CreateResponsesCollection.call(
      parent_collection: test_results_collection,
      test_collection: test_collection,
      test_audiences: test_collection.test_audiences,
      created_by: created_by,
      idea: idea,
    )
  end

  it 'creates a responses collection in the master results collection' do
    expect(subject).to be_a_success
    expect(test_results_collection.collection_cards.identifier(
      CardIdentifier.call(test_results_collection, 'Responses'),
    ).count).to be 1
  end

  it 'should sets the master responses name to "All Responses"' do
    expect(subject.all_responses_collection.name).to eq 'All Responses'
  end

  it 'should create alias collections for each respondent' do
    alias_collections = subject.all_responses_collection.collections.where.not(
      survey_response_id: nil,
    )
    expect(alias_collections.count).to eq num_responses
  end

  it 'should name alias collections for each respondent' do
    alias_collection = subject.all_responses_collection.collections.where.not(
      survey_response_id: nil,
    ).first
    expect(alias_collection.name).to eq "#{test_collection.base_name} - #{test_collection.survey_responses.first.respondent_alias}"
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
    audience_name = test_collection.test_audiences.open.first.audience_name
    expect(audience_collection.name).to eq "#{test_collection.base_name} - #{audience_name}"
  end

  context 'with link sharing' do
    let(:link_sharing) { true }
    let(:test_collection) do
      create(:test_collection, :completed, :with_responses, :with_test_audience, num_responses: num_responses)
    end
    let(:link_sharing) { test_collection.test_audiences.where(price_per_response: 0).first }

    it 'should create two audience TRCs with audience names' do
      audience_collections = subject.all_responses_collection.collections.where(
        survey_response_id: nil,
      )
      expect(audience_collections.count).to eq 2
      audience_trc_names = test_collection.test_audiences.map do |ta|
        "#{test_collection.base_name} - #{ta.audience_name}"
      end
      expect(audience_collections.map(&:name)).to match_array(audience_trc_names)
    end

    context 'with link sharing turned off' do
      before do
        link_sharing.update(status: :closed)
      end

      it 'should create one audience TRC' do
        audience_collections = subject.all_responses_collection.collections.where(
          survey_response_id: nil,
        )
        expect(audience_collections.count).to eq 1
      end
    end
  end

  context 'with an idea' do
    let(:test_collection) { create(:test_collection, :completed) }
    let(:master_test_results_collection) { create(:test_results_collection, test_collection: test_collection) }
    let(:idea) { test_collection.idea_items.first }
    before do
      # create the All Responses collection so we can link from that
      TestResultsCollection::CreateResponsesCollection.call(
        parent_collection: master_test_results_collection,
        test_collection: test_collection,
        test_audiences: test_collection.test_audiences,
        created_by: created_by,
      )
    end

    it 'should link the TSRC responses collection into the current TRC' do
      subject
      link_card = test_results_collection.collection_cards.last
      expect(link_card.link?).to be true

      master_responses = CollectionCard.find_record_by_identifier(
        master_test_results_collection,
        'Responses',
      )
      expect(link_card.record).to eq master_responses
    end
  end
end
