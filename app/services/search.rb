class Search
  def initialize(options = {})
    default_options = {
      fields: %w[handle^6 name^5 tags^3 content],
      per_page: 10,
      page: 1,
    }
    @options = default_options.merge(options)
  end

  def search(query)
    where = @options[:where] || {}

    filters.each do |filter|
      f = filter.new(query)
      if f.match?
        where = where.merge(f.where)
        query = f.modify_query
      end
    end

    Searchkick.search(
      query.blank? ? '*' : query,
      @options.merge(where: where),
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
