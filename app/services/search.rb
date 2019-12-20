class Search
  def initialize(options = {})
    default_options = {
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
    }
    @options = default_options.merge(options)
  end

  def search(query)
    filters.each do |filter|
      f = filter.new(query)
      next unless f.match?

      @options = @options.deep_merge(f.options)
      query = f.modify_query
    end

    Searchkick.search(
      query.blank? ? '*' : query,
      @options,
    )
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
      Filters::RecordId,
    ]
  end
end
