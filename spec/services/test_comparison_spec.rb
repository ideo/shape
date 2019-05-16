require 'rails_helper'

RSpec.describe TestComparison do
  let(:user) { create(:user) }
  let(:test_parent) { create(:collection, add_editors: [user]) }
  let(:test_collection) do
    create(:test_collection,
           :completed,
           parent_collection: test_parent,
           roles_anchor_collection: test_parent)
  end
  let(:test_data_item) do
    test_collection.data_items.report_type_question_item.first
  end
  let(:comparison_collection) do
    create(:test_collection,
           :completed,
           parent_collection: test_parent,
           roles_anchor_collection: test_parent)
  end
  let(:comparison_data_item) do
    comparison_collection.data_items.report_type_question_item.first
  end

  before do
    [test_collection, comparison_collection].each do |collection|
      collection.launch!(initiated_by: user)
      collection.reload
    end
  end

  describe '#add' do
    let(:add) do
      TestComparison.add(
        collection: test_collection,
        comparison_collection: comparison_collection,
      )
    end

    it 'adds datasets from comparison to test collection data items' do
      expect(test_data_item.datasets.size).to eq(1)
      expect(test_data_item.datasets).not_to include(comparison_data_item.datasets.first)
      expect { add }.to change(DataItemsDataset, :count).by(1)
      test_data_item.datasets.reload
      expect(test_data_item.datasets).to include(comparison_data_item.datasets.first)
      expect(test_data_item.datasets.size).to eq(2)
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
        not_matching_question_item.create_response_graph(
          parent_collection: test_collection,
          initiated_by: user,
          legend_item: test_collection.legend_item,
        ).record
      end

      it 'adds empty dataset' do
        expect(not_matching_question_data_item.datasets.size).to eq(1)
        expect(not_matching_question_data_item.datasets.pluck(:type)).not_to include('Dataset::Empty')
        expect { add }.to change(Dataset::Empty, :count).by(1)
        empty_dataset = Dataset::Empty.last
        not_matching_question_data_item.datasets.reload
        expect(not_matching_question_data_item.datasets.size).to eq(2)
        expect(not_matching_question_data_item.datasets).to include(empty_dataset)
      end
    end

    context 'if collections are the same' do
      let!(:add) do
        TestComparison.add(
          collection: test_collection,
          comparison_collection: test_collection,
        )
      end

      it 'does not add' do
        expect { add }.not_to change(DataItemsDataset, :count)
      end

      it 'returns false' do
        expect(add).to be false
      end
    end
  end

  describe '#remove' do
    before do
      TestComparison.add(
        collection: test_collection,
        comparison_collection: comparison_collection,
      )
    end
    let(:remove) do
      TestComparison.remove(
        collection: test_collection,
        comparison_collection: comparison_collection,
      )
    end

    it 'removes datasets from test collection data items' do
      expect(test_data_item.datasets.size).to eq(2)
      expect(test_data_item.datasets).to include(comparison_data_item.datasets.first)
      expect { remove }.to change(DataItemsDataset, :count).by(-1)
      test_data_item.datasets.reload
      expect(test_data_item.datasets).not_to include(comparison_data_item.datasets.first)
      expect(test_data_item.datasets.size).to eq(1)
    end
  end
end
