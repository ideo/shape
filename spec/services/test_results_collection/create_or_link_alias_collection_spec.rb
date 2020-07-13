require 'rails_helper'

RSpec.describe TestResultsCollection::CreateOrLinkAliasCollection, type: :service do
  let(:test_collection) { create(:test_collection, :completed, :with_test_audience) }
  let(:test_audience) { test_collection.test_audiences.first }
  let(:test_results_collection) { create(:test_results_collection, test_collection: test_collection) }
  let(:all_responses_collection) do
    CollectionCard.find_record_by_identifier(
      test_results_collection,
      'Responses',
    )
  end
  let(:survey_response) do
    create(:survey_response, :fully_answered, test_collection: test_collection, test_audience: test_audience)
  end
  let(:created_by) { create(:user) }
  let(:context) { subject.context }

  before do
    allow(TestResultsCollection::CreateAndLinkOpenResponse).to receive(:call)
    TestResultsCollection::CreateContent.call(
      test_results_collection: test_results_collection,
    )
    # now evaluate survey response so it can create after the results were set up
    survey_response
  end

  subject do
    TestResultsCollection::CreateOrLinkAliasCollection.new(
      test_collection: test_collection,
      all_responses_collection: all_responses_collection,
      survey_response: survey_response,
      created_by: created_by,
    )
  end

  it 'calls CreateAndLinkOpenResponse with expected params' do
    survey_response.question_answers.each do |question_answer|
      next unless question_answer.question.question_open?

      expect(TestResultsCollection::CreateAndLinkOpenResponse).to receive(:call).with(
        test_collection: test_collection,
        question_answer: question_answer,
      )
    end
    subject.call
  end

  it 'creates the test results collection for the survey response' do
    expect {
      subject.call
      # Alias collection, ideas collection, responses collection
    }.to change(Collection, :count).by(3)
    identifier = CardIdentifier.call(test_results_collection, survey_response)
    alias_collection = CollectionCard.identifier(identifier).first.collection
    # this should match the created alias_test_results_collection
    expect(alias_collection).to eq context.alias_test_results_collection
    # this response link
    expect(alias_collection.link_collection_cards.count).to eq 1
    # Ideas and Responses
    expect(alias_collection.collections.count).to eq 2
    responses = alias_collection.collections.last
    expect(responses.name).to eq "#{survey_response.respondent_alias} Responses"
  end

  context 're-calling the worker, which would call the service again' do
    it 'should not create any new collections' do
      expect {
        subject.call
      }.to change(CollectionCard, :count).by(12)
      expect {
        subject.call
        # everything should be find_or_create at this point
      }.not_to change(CollectionCard, :count)
    end
  end
end
