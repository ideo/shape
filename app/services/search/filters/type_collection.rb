class Search
  module Filters
    class TypeCollection < Base
      REGEXP = /type:collections?/

      def options
        { index_name: [Collection] }
      end
    end
  end
end
