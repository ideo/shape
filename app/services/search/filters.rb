class Search
  module Filters
    class Base
      def initialize(query)
        @query = query
      end

      def match?
        @query.match(self.class::REGEXP)
      end

      def remove_regexp
        @query.gsub(/#{self.class::REGEXP}\s*/, '')
      end

      def modify_query
        remove_regexp
      end
    end
  end
end
