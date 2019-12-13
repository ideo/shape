require 'rails_helper'

RSpec.describe Search::Filters::WithinCollection do
  describe '#options' do
    context 'when there is not a within match in the query' do
      it 'returns empty where criteria' do
        result = Search::Filters::WithinCollection.new('foo bar baz').options
        expect(result).to eq(where: {})
      end
    end

    context 'when there is a within match in the query' do
      it 'returns a where for the parent ids' do
        result = Search::Filters::WithinCollection.new('foo within(bar/123) baz').options
        expect(result).to eq(
          where: {
            parent_ids: {
              all: [123],
            },
          },
        )
      end
    end
  end

  describe '#within_collection_id' do
    it 'returns parent collection id' do
      within_collection_id = Search::Filters::WithinCollection.new('foo within(bar/123) baz').within_collection_id
      expect(within_collection_id).to eq('123')

      within_collection_id = Search::Filters::WithinCollection.new('foo within(bar-counter/123) baz').within_collection_id
      expect(within_collection_id).to eq('123')
    end

    it 'returns nil if no parent collection id' do
      within_collection_id = Search::Filters::WithinCollection.new('foo baz').within_collection_id
      expect(within_collection_id).to be_nil
    end
  end

  describe '#modify_query' do
    context 'when there is not a within match in the query' do
      it 'returns the query unmodified' do
        result = Search::Filters::WithinCollection.new('foo bar baz').modify_query
        expect(result).to eq('foo bar baz')
      end
    end

    context 'when there is a within match in the query' do
      it 'returns the query without the within match in it' do
        result = Search::Filters::WithinCollection.new('foo within(bar/123) qux').modify_query
        expect(result).to eq('foo qux')
      end
    end
  end
end
