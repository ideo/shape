class Search
  module Filters
    class Tag < Base
      REGEXP = /#\w+/

      def options
        tags = @query.scan(REGEXP).flatten.map { |tag| tag.delete('#') }
        where = {}
        where[:tags] = { all: tags } if tags.count.positive?
        { where: where }
      end

      def modify_query
        @query.gsub(/#{REGEXP}\s*/, '')
      end
    end
  end
end
