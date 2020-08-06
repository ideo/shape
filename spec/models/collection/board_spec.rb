require 'rails_helper'

describe Collection::Board, type: :model do
  describe '#max_col_limit' do
    let(:collection) { create(:board_collection, num_columns: 4) }

    it 'returns num_columns - 1' do
      expect(collection.max_col_limit).to eq(3)
    end
  end

  describe '#before_create' do
    let(:collection) { create(:board_collection) }

    it 'sets collection_type before creation' do
      expect(collection.collection_type).to eq('foamcore')
    end

    context 'with a challenge (non-standard collection_type)' do
      let(:collection) { create(:board_collection, :challenge) }

      it 'preserves chosen collection_type on creation' do
        # e.g. when duplicating a collection we don't want before_create to override as 'foamcore'
        expect(collection.collection_type).to eq('challenge')
      end
    end
  end
end
