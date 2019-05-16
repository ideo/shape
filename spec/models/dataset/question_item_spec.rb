require 'rails_helper'

RSpec.describe Dataset::QuestionItem, type: :model do

  describe '#measure' do
    let!(:test_collection) { create(:test_collection) }
    let!(:question_item) { create(:question_item, parent_collection: test_collection) }
    let(:dataset) { create(:question_item_dataset, data_source: question_item) }

    it 'uses question item collection name' do
      expect(dataset.measure).to eq(test_collection.name)
    end

    context 'if TestDesign collection' do
      before do
        test_collection.update(
          name: Collection::TestDesign.generate_name('Innovative Stuff'),
        )
      end

      it 'removes "Feedback Design" from the name' do
        expect(test_collection.name).to eq('Innovative Stuff Feedback Design')
        expect(dataset.measure).to eq('Innovative Stuff')
      end
    end
  end
end
