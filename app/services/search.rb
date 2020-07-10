class Search
  attr_reader :options

  def self.default_options
    {
      fields: [
        'name^50',
        'handle^50',
        'tags^20',
        'user_tags^20',
        'content',
      ],
      # `missing` just means this field is allowed to be missing
      boost_by: { activity_count: { factor: 0.2, missing: 0 } },
      per_page: 10,
      page: 1,
      where: {},
    }
  end

  def initialize(options = {})
    @options = self.class.default_options.merge(options)
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
      Filters::UserTag,
      Filters::WithinCollection,
      Filters::ActivityDateRange,
      Filters::TypeCollection,
      Filters::TypeItem,
      Filters::CollectionType,
      Filters::RecordId,
    ]
  end
end
