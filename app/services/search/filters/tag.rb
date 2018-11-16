class Search
  module Filters
    class Tag < Base
      REGEXP = /#\w+/

      def where
        tags = @query.scan(REGEXP).flatten.map { |tag| tag.delete('#') }
        where = {}
        where[:tags] = { all: tags } if tags.count.positive?
        where
      end

      def modify_query
        @query.gsub(/#{REGEXP}\s*/, '')
      end
    end
  end
end
