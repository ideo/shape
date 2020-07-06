require 'rails_helper'

RSpec.describe Search::Filters::Tag do
  subject do
    Search::Filters::UserTag.new(query)
  end

  describe '#options' do
    context 'when there are not user tags in the query' do
      let(:query) { 'foo bar baz qux' }

      it 'returns empty where criteria' do
        expect(subject.options).to eq(where: {})
      end
    end

    context 'when there are user tags in the query' do
      let(:query) { 'foo @someone baz @someone-else' }

      it 'returns a where for the tags' do
        expect(subject.options).to eq(
          where: {
            user_tags: {
              all: %w[someone someone-else],
            },
          },
        )
      end
    end
  end

  describe '#modify_query' do
    context 'when there are not tags in the query' do
      let(:query) { 'foo bar baz qux' }

      it 'returns the query unmodified' do
        expect(subject.modify_query).to eq('foo bar baz qux')
      end
    end

    context 'when there are tags in the query' do
      let(:query) { 'foo @someone baz @someone-else' }

      it 'returns the query without the tags in it' do
        expect(subject.modify_query).to eq('foo baz')
      end
    end
  end
end
