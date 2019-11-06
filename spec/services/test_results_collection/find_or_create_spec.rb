require 'rails_helper'

RSpec.describe TestResultsCollection::FindOrCreate, type: :service do
  let(:test_collection) { create(:test_collection) }
  subject do
    TestResultsCollection::FindOrCreate.call(
      test_collection: test_collection,
    )
  end

  it 'calls organized interactors' do
    [
      TestResultsCollection::CreateCollection,
      TestResultsCollection::CreateOpenResponseCollections,
      TestResultsCollection::CreateResponseGraphs,
      TestResultsCollection::CreateMediaItemLinks,
    ].each do |interactor_klass|
      allow(interactor_klass).to receive(:call!).and_call_original
      expect(interactor_klass).to receive(:call!)
    end
    subject
  end

  context 'with more scaled questions' do
    let!(:test_collection) { create(:test_collection, :completed) }
    let(:test_results_collection) { test_collection.test_results_collection }
    let!(:scale_questions) { create_list(:question_item, 2, parent_collection: test_collection) }
    let(:legend_item) { test_results_collection.legend_item }

    it 'should create a LegendItem at the 3rd spot (order == 2)' do
      subject
      expect(legend_item.parent_collection_card.order).to eq 2
      expect(
        test_results_collection
        .collection_cards
        .reload
        .map { |card| card.record.class.name },
      ).to eq(
        [
          'Item::VideoItem',
          'Item::DataItem',
          'Item::LegendItem',
          'Item::DataItem',
          'Item::DataItem',
          'Item::DataItem',
          'Item::DataItem',
          'Item::DataItem',
          'Collection::TestOpenResponses',
          'Collection::TestOpenResponses',
          'Collection::TestCollection',
        ],
      )
      expect(
        test_results_collection
        .collection_cards
        .map(&:order),
      ).to eq(0.upto(10).to_a)
    end
  end
end
