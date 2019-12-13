class Search
  module Filters
    class WithinCollection < Base
      REGEXP = %r{within\(#{Organization::SLUG_SUBSTR}\/*(\d+)\)}i.freeze

      def within_collection_id
        @query.scan(REGEXP).flatten[0]
      end

      def options
        where = {}
        where[:parent_ids] = { all: [within_collection_id.to_i] } if within_collection_id
        { where: where }
      end
    end
  end
end
