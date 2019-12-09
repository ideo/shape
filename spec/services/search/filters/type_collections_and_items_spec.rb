require 'rails_helper'

RSpec.describe Search::Filters::TypeCollectionsAndItems do
  describe '#options' do
    it 'returns options to set index name' do
      result = Search::Filters::TypeCollectionsAndItems.new('foo type:collections_and_items baz').options
      expect(result).to eq(
        index_name: [Collection, Item],
      )
    end
  end

  describe '#modify_query' do
    it 'returns the query without the match' do
      result = Search::Filters::TypeCollectionsAndItems.new('foo type:collections_and_items qux').modify_query
      expect(result).to eq('foo qux')
    end
  end
end
