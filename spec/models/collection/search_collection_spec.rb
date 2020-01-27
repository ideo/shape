require 'rails_helper'

describe Collection::SearchCollection, type: :model do
  describe '#reassign_search_term_within!' do
    let(:search_collection) do
      create(
        :search_collection,
        name: 'bananas within:1234 xyz',
        search_term: 'bananas within:1234 xyz',
      )
    end
    let(:reassign_search_term_within) do
      search_collection.reassign_search_term_within!(
        from_collection_id: 1234,
        to_collection_id: 5678,
      )
    end

    it 'changes reference to search_term collection' do
      expect(search_collection.within_collection_id).to eq(1234)
      reassign_search_term_within
      expect(search_collection.search_term).to eq(
        'bananas within:5678 xyz',
      )
      expect(search_collection.within_collection_id).to eq(5678)
    end

    it 'updates collection if name was same as search term' do
      reassign_search_term_within
      expect(search_collection.name).to eq('bananas within:5678 xyz')
    end

    context 'with name different from search term' do
      before do
        search_collection.update(name: 'Bananas and Peanut Butter')
      end

      it 'does not change name' do
        reassign_search_term_within
        expect(search_collection.name).to eq('Bananas and Peanut Butter')
      end
    end
  end
end
