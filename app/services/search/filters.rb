class Search
  module Filters
    class Base
      def initialize(query)
        @query = query
      end

      def match?
        @query.match(self.class::REGEXP)
      end
    end
  end
end
