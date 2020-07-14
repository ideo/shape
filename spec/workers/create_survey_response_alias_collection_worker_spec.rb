require 'rails_helper'

RSpec.describe CreateSurveyResponseAliasCollectionWorker, type: :worker do
  describe '#perform' do
    let(:user) { create(:user) }
    let(:test_collection) { create(:test_collection, :launched) }
    let!(:test_audience) { create(:test_audience, test_collection: test_collection) }
    let(:test_results_collection) { test_collection.test_results_collection }
    let(:all_responses_collection) do
      CollectionCard.find_record_by_identifier(
        test_results_collection,
        'Responses',
      )
    end
    let(:survey_response) do
      create(
        :survey_response,
        :fully_answered,
        test_collection: test_collection,
        test_audience: test_audience,
      )
    end

    subject do
      CreateSurveyResponseAliasCollectionWorker.new
    end

    before do
      allow(TestResultsCollection::CreateAndLinkOpenResponse).to receive(:call)
      TestResultsCollection::CreateContent.call(
        test_results_collection: test_collection.test_results_collection,
      )
      allow(TestResultsCollection::CreateOrLinkAliasCollection).to receive(:call).and_call_original
    end

    it 'calls TestResultsCollection::CreateOrLinkAliasCollection' do
      expect(TestResultsCollection::CreateOrLinkAliasCollection).to receive(:call).with(
        test_collection: test_collection,
        all_responses_collection: all_responses_collection,
        survey_response: survey_response,
        created_by: survey_response.user,
      )
      subject.perform(survey_response.id)
    end

    it 'updates all test result collections' do
      prev_updated_at = test_results_collection.updated_at
      # test_results, idea, alias (DefaultCollectionCover also pings...)
      expect(CollectionUpdateBroadcaster).to receive(:call).at_least(3).times
      # call the worker -- this will create the alias results
      subject.perform(survey_response.id)
      collections_to_update = [test_results_collection] + Collection::TestResultsCollection.in_collection(test_results_collection)
      collections_to_update.each do |collection|
        expect(collection.reload.updated_at > prev_updated_at).to be true
      end
    end
  end
end
