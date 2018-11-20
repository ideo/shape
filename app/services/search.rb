class Search
  def initialize(options = {})
    default_options = {
      fields: %w[handle^6 name^5 tags^3 content],
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
      Filters::Tag,
      Filters::WithinCollection,
      Filters::ActivityDateRange,
    ]
  end
end
