require 'rails_helper'

RSpec.describe CreateSurveyResponseAliasCollectionWorker, type: :worker do
  subject do
    CreateSurveyResponseAliasCollectionWorker.new
  end
  describe '#perform' do
    let(:user) { create(:user) }
    let(:test_collection) { create(:test_collection, :completed) }
    let!(:test_audience) { create(:test_audience, test_collection: test_collection) }
    before do
      expect(test_collection.launch!(initiated_by: user)).to be true
      expect(test_collection.live?).to be true
    end
    let(:test_results_collection) { test_collection.test_results_collection }
    let(:all_responses_collection) do
      CollectionCard.identifier(
        CardIdentifier.call(test_results_collection, 'Responses'),
      ).first.record
    end
    let(:survey_response) do
      create(
        :survey_response,
        :fully_answered,
        test_collection: test_collection,
        test_audience: test_audience,
      )
    end

    before do
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

    it 'updates master TestResultsCollection collection' do
      prev_updated_at = test_results_collection.updated_at
      subject.perform(survey_response.id)
      expect(test_results_collection.reload.updated_at).to be > prev_updated_at
    end
  end
end
