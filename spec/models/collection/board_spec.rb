require 'rails_helper'

describe Collection::Board, type: :model do
  describe '#max_col_limit' do
    let(:collection) { create(:board_collection, num_columns: 4) }
    it 'returns num_columns - 1' do
      expect(collection.max_col_limit).to eq(3)
    end
  end

  describe '#before_create' do
    let(:collection) { create(:board_collection, num_columns: 4) }
    it 'sets collection_type before creation' do
      expect(collection.collection_type).to eq('foamcore')
    end
  end
end
