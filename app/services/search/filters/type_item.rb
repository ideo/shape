class Search
  module Filters
    class TypeItem < Base
      REGEXP = /type:items?/

      def options
        { index_name: [Item] }
      end
    end
  end
end
