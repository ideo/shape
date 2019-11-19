require 'rails_helper'

RSpec.describe Dataset::Question, type: :model do
  describe '#name' do
    let!(:test_collection) { create(:test_collection) }
    let!(:question_item) { create(:question_item, parent_collection: test_collection) }
    let(:dataset) { create(:question_dataset, data_source: question_item) }

    it 'uses question item collection name' do
      expect(dataset.name).to eq(test_collection.name)
    end

    context 'if TestCollection' do
      let(:name) { 'Innovative Stuff' }
      let(:feedback_design_name) do
        "#{name}#{Collection::TestCollection::FEEDBACK_DESIGN_SUFFIX}"
      end
      before do
        test_collection.update(
          name: feedback_design_name,
        )
      end

      it 'uses the test_collection.base_name' do
        expect(test_collection.name).to eq(feedback_design_name)
        expect(dataset.name).to eq(name)
        expect(dataset.name).to eq(test_collection.base_name)
      end
    end

    context 'for category satisfaction question' do
      let(:question_item) do
        create(
          :question_item,
          question_type: :question_category_satisfaction,
          parent_collection: test_collection,
          content: 'socks',
        )
      end

      it 'uses the description with full content' do
        expect(dataset.description).to eq 'How satisfied are you with your current socks?'
        expect(dataset.name).to eq test_collection.name
      end
    end
  end
end
