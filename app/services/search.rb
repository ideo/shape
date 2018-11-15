class Search
  def initialize(options)
    default_options = {
      fields: %w[handle^6 name^5 tags^3 content],
      per_page: 10,
      page: 1,
    }
    @options = default_options.merge(options)
  end

  def search(query)
    where = @options[:where] || {}
    %i[tags_where in_collection_where].each do |symbol|
      where = where.merge(send(symbol, query))
    end
    cleaned_query = clean_query(query)
    Searchkick.search(
      cleaned_query.blank? ? '*' : cleaned_query,
      @options.merge(where: where),
    )
  end

  private

  def filters
    [
      %r{within\([A-z\/]*(\d+)\)}i,
      /#\w+\s/,
    ]
  end

  def clean_query(query)
    filters.each do |filter|
      if query.match?(filter)
        query = query.gsub(filter, '')
      end
    end
    query
  end

  def tags_where(query)
    tags = query.scan(/#\w+/).flatten.map { |tag| tag.delete('#') }
    where = {}
    where[:tags] = { all: tags } if tags.count.positive?
    where
  end

  def in_collection_where(query)
    # add "within" search params
    within_collection_id = query.scan(%r{within\([A-z\/]*(\d+)}i).flatten[0]
    where = {}
    where[:parent_ids] = { all: [within_collection_id.to_i] } if within_collection_id
    where
  end
end
