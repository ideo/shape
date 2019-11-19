require 'rails_helper'

RSpec.describe TestComparison do
  let(:user) { create(:user) }
  let(:test_parent) { create(:collection, add_editors: [user]) }
  let(:test_collection) do
    create(:test_collection,
           :launched,
           parent_collection: test_parent,
           roles_anchor_collection: test_parent)
  end
  let(:num_scale_questions) { test_collection.question_items.scale_questions.size }
  let(:test_results_collection) { test_collection.test_results_collection }
  let(:test_data_item) do
    test_results_collection.data_items.report_type_question_item.first
  end
  let(:comparison_collection) do
    create(:test_collection,
           :launched,
           parent_collection: test_parent,
           roles_anchor_collection: test_parent)
  end
  let(:comparison_results_collection) { comparison_collection.test_results_collection }
  let(:comparison_data_item) do
    comparison_results_collection.data_items.report_type_question_item.first
  end

  before do
    [test_collection, comparison_collection].each do |collection|
      TestResultsCollection::CreateContent.call(
        test_results_collection: collection.test_results_collection,
      )
      collection.reload
    end
  end

  describe '#add' do
    let(:add) do
      TestComparison.new(
        collection: test_collection,
        comparison_collection: comparison_collection,
      ).add
    end

    it 'adds datasets from comparison to test collection data items' do
      expect(test_data_item.datasets.size).to eq(3)
      expect(test_data_item.datasets).not_to include(comparison_data_item.datasets.first)
      expect { add }.to change(DataItemsDataset, :count).by(num_scale_questions)
      test_data_item.datasets.reload
      expect(test_data_item.datasets).to include(comparison_data_item.datasets.first)
      expect(test_data_item.datasets.size).to eq(4)
    end

    context 'if collection has different question type' do
      let!(:not_matching_question_type) do
        existing_types = test_collection.question_items.pluck(:question_type).uniq
        (Item::QuestionItem.question_type_categories[:scaled_rating] - existing_types).first
      end
      let!(:not_matching_question_item) do
        create(
          :question_item,
          parent_collection: test_collection,
          question_type: not_matching_question_type,
        )
      end
      let(:not_matching_question_data_item) do
        graph = TestResultsCollection::CreateResponseGraph.call(
          item: not_matching_question_item,
          parent_collection: test_results_collection,
        )
        graph.data_item
      end

      it 'adds empty dataset' do
        expect(not_matching_question_data_item.datasets.size).to eq(3)
        expect(not_matching_question_data_item.datasets.pluck(:type)).not_to include('Dataset::Empty')
        expect { add }.to change(Dataset::Empty, :count).by(1)
        empty_dataset = Dataset::Empty.last
        not_matching_question_data_item.datasets.reload
        expect(not_matching_question_data_item.datasets.size).to eq(4)
        expect(not_matching_question_data_item.datasets).to include(empty_dataset)
      end
    end

    context 'if collections are the same' do
      let!(:add) do
        TestComparison.new(
          collection: test_collection,
          comparison_collection: test_collection,
        ).add
      end

      it 'does not add' do
        expect { add }.not_to change(DataItemsDataset, :count)
      end

      it 'returns false' do
        expect(add).to be false
      end
    end

    context 'if dataset is already linked' do
      let!(:data_items_dataset) do
        test_data_item.data_items_datasets.create(
          dataset: comparison_data_item.datasets.first,
          selected: false,
        )
      end

      it 'makes sure it is selected' do
        expect(data_items_dataset.selected).to be false
        expect(add).to be true
        expect(data_items_dataset.reload.selected).to be true
      end
    end
  end

  describe '#remove' do
    before do
      TestComparison.new(
        collection: test_collection,
        comparison_collection: comparison_collection,
      ).add
    end
    let(:remove) do
      TestComparison.new(
        collection: test_collection,
        comparison_collection: comparison_collection,
      ).remove
    end

    it 'removes datasets from test collection data items' do
      expect(test_data_item.datasets.size).to eq(4)
      expect(test_data_item.datasets).to include(comparison_data_item.datasets.first)
      expect { remove }.to change(DataItemsDataset, :count).by(-num_scale_questions)
      test_data_item.datasets.reload
      expect(test_data_item.datasets).not_to include(comparison_data_item.datasets.first)
      expect(test_data_item.datasets.size).to eq(3)
    end

    context 'with an empty dataset' do
      let!(:empty_dataset) { create(:empty_dataset, data_source: comparison_collection) }
      let(:data_items) { test_results_collection.data_items }

      before do
        data_items.each do |di|
          di.data_items_datasets.create(dataset: empty_dataset)
        end
      end

      it 'removes empty datasets' do
        expect {
          remove
        }.to change(DataItemsDataset, :count).by(-2 * num_scale_questions)
        data_items.each do |di|
          expect(di.datasets).not_to include(empty_dataset)
        end
      end
    end
  end
end
