require 'rails_helper'

RSpec.describe Search::Filters::ActivityDateRange do
  describe '#where' do
    context 'when there is no match in the query' do
      it 'returns empty where criteria' do
        result = Search::Filters::ActivityDateRange.new('foo bar baz').where
        expect(result).to eq({})
      end
    end

    context 'when there is a match for updated in the query' do
      it 'returns a where the included date' do
        result = Search::Filters::ActivityDateRange.new('foo Updated(20/10/1990,  30/1/2001) baz').where
        expect(result).to eq(
          activity_dates: {
            gte: Date.strptime('20/10/1990', '%d/%m/%Y'),
            lte: Date.strptime('30/1/2001', '%d/%m/%Y'),
          },
        )
      end
    end
  end

  describe 'modify_query' do
    context 'when there is no match in the query' do
      it 'returns the query unmodified' do
        result = Search::Filters::ActivityDateRange.new('foo bar baz').modify_query
        expect(result).to eq('foo bar baz')
      end
    end

    context 'when there are tags in the query' do
      it 'returns the query without the tags in it' do
        result = Search::Filters::ActivityDateRange.new('foo Updated(20/10/1990,  30/1/2001) qux').modify_query
        expect(result).to eq('foo qux')
      end
    end
  end
end
