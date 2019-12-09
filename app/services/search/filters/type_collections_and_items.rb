class Search
  module Filters
    class TypeCollectionsAndItems < Base
      REGEXP = /type:collections_and_items?/.freeze

      def options
        { index_name: [Collection, Item] }
      end
    end
  end
end
