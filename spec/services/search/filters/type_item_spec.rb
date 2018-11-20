require 'rails_helper'

RSpec.describe Search::Filters::TypeItem do
  describe '#options' do
    it 'returns options to set index name' do
      result = Search::Filters::TypeItem.new('foo type:item baz').options
      expect(result).to eq(
        index_name: [Item],
      )
    end
  end

  describe '#modify_query' do
    it 'returns the query without the match' do
      result = Search::Filters::TypeItem.new('foo type:item qux').modify_query
      expect(result).to eq('foo qux')
    end
  end
end
