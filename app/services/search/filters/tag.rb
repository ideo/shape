class Search
  module Filters
    class Tag < Base
      REGEXP = /#\w+/

      def initialize(query)
        @query = query
      end

      def where
        tags = @query.scan(/#\w+/).flatten.map { |tag| tag.delete('#') }
        where = {}
        where[:tags] = { all: tags } if tags.count.positive?
        where
      end

      def modify_query
        @query.gsub(/#\w+\s*/, '')
      end
    end
  end
end
