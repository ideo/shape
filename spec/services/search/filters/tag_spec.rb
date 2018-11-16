require 'rails_helper'

RSpec.describe Search::Filters::Tag do
  describe '#where' do
    context 'when there are not tags in the query' do
      it 'returns empty where criteria' do
        result = Search::Filters::Tag.new('foo bar baz qux').where
        expect(result).to eq({})
      end
    end

    context 'when there are tags in the query' do
      it 'returns a where for the tags' do
        result = Search::Filters::Tag.new('foo #bar baz #qux').where
        expect(result).to eq(
          tags: {
            all: %w[bar qux],
          },
        )
      end
    end
  end

  describe 'modify_query' do
    context 'when there are not tags in the query' do
      it 'returns the query unmodified' do
        result = Search::Filters::Tag.new('foo bar baz qux').modify_query
        expect(result).to eq('foo bar baz qux')
      end
    end

    context 'when there are tags in the query' do
      it 'returns the query without the tags in it' do
        result = Search::Filters::Tag.new('foo #bar #baz qux').modify_query
        expect(result).to eq('foo qux')
      end
    end
  end
end
