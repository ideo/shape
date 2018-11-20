require 'rails_helper'

RSpec.describe Search::Filters::TypeCollection do
  describe '#options' do
    it 'returns options to set index name' do
      result = Search::Filters::TypeCollection.new('foo type:collection baz').options
      expect(result).to eq(
        index_name: [Collection],
      )
    end
  end

  describe '#modify_query' do
    it 'returns the query without the match' do
      result = Search::Filters::TypeCollection.new('foo type:collection qux').modify_query
      expect(result).to eq('foo qux')
    end
  end
end
