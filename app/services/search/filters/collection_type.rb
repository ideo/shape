class Search
  module Filters
    class CollectionType < Base
      REGEXP = /type:(method|project|prototype|profile|phase|challenge)?/.freeze

      def options
        collection_type = @query.scan(REGEXP).flatten.first
        where = {}
        # `where` option is case-sensitive so we have to downcase the search
        # https://github.com/ankane/searchkick/issues/177#issuecomment-340422886
        where[:collection_type] = collection_type
        { where: where }
      end
    end
  end
end
