class Search
  attr_reader :options

  DEFAULT_OPTIONS = {
    fields: [
      'name^50',
      'handle^50',
      'tags^20',
      'content',
    ],
    # `missing` just means this field is allowed to be missing
    boost_by: { activity_count: { factor: 0.2, missing: 0 } },
    per_page: 10,
    page: 1,
    where: {},
  }.freeze

  def initialize(options = {})
    @options = DEFAULT_OPTIONS.merge(options)
  end

  def search(query)
    modified_query = apply_filters(query)

    Searchkick.search(
      modified_query.presence || '*',
      @options,
    )
  end

  def apply_filters(query)
    filters.each do |filter|
      f = filter.new(query)
      next unless f.match?

      @options = @options.deep_merge(f.options)
      query = f.modify_query
    end
    query
  end

  private

  def filters
    [
      Filters::TestAnswer,
      Filters::Tag,
      Filters::WithinCollection,
      Filters::ActivityDateRange,
      Filters::TypeCollection,
      Filters::TypeItem,
      Filters::CollectionType,
      Filters::RecordId,
    ]
  end
end
