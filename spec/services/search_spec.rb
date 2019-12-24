require 'rails_helper'

RSpec.describe Search do
  let(:search_term) { 'foo' }
  let(:expected_defaults) do
    {
      fields: [
        'name^50',
        'handle^50',
        'tags^20',
        'content',
      ],
      boost_by: { activity_count: { factor: 0.2, missing: 0 } },
      per_page: 10,
      page: 1,
      where: {},
    }
  end

  before do
    filters = []
    allow_any_instance_of(Search).to receive(:filters).and_return(filters)
  end

  it 'has default options' do
    search = Search.new
    expect(Searchkick).to receive(:search)
      .with(search_term,
            expected_defaults)
    search.search(search_term)
  end

  it 'merges option overrides with default options' do
    search = Search.new(
      foo: 'bar',
      where: { baz: 'qux' },
    )
    expect(Searchkick).to receive(:search)
      .with(search_term,
            fields: expected_defaults[:fields],
            boost_by: expected_defaults[:boost_by],
            foo: 'bar',
            per_page: 10,
            page: 1,
            where: { baz: 'qux' })
    search.search(search_term)
  end

  it 'defaults the search term if it is blank' do
    search = Search.new
    expect(Searchkick).to receive(:search).with('*', expected_defaults)
    search.search('')
  end

  it 'applies filters' do
    filter = class_double('filter')
    filter_instance = double('filter_instance')

    expect(filter_instance).to receive(:match?).and_return(true)
    expect(filter_instance).to receive(:options).and_return(where: { foo: 'bar' })
    expect(filter_instance).to receive(:modify_query).and_return('derp')

    expect(filter).to receive(:new).with(search_term).and_return(filter_instance)

    search = Search.new
    allow(search).to receive(:filters).and_return([filter])

    expect(Searchkick).to receive(:search)
      .with('derp',
            fields: expected_defaults[:fields],
            boost_by: expected_defaults[:boost_by],
            per_page: 10,
            page: 1,
            where: { foo: 'bar' })

    search.search(search_term)
  end
end
