require 'rails_helper'

RSpec.describe Search::Filters::CollectionType do
  describe '#options' do
    it 'returns options to given collection type' do
      collection_types = %w[method project prototype profile phase challenge].each do |collection_type|
        result = Search::Filters::CollectionType.new("foo type:#{collection_type} baz").options
        expect(result).to eq(
          where: { collection_type: collection_type },
        )
      end
    end
  end

  describe '#modify_query' do
    it 'returns the query without the match' do
      collection_types = %w[method project prototype profile phase challenge].each do |collection_type|
        result = Search::Filters::CollectionType.new("foo type:#{collection_type} qux").modify_query
        expect(result).to eq('foo qux')
      end
    end
  end
end
