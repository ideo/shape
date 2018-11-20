class Search
  module Filters
    class WithinCollection < Base
      REGEXP = %r{within\([A-z\/]*(\d+)\)}i

      def options
        within_collection_id = @query.scan(REGEXP).flatten[0]
        where = {}
        where[:parent_ids] = { all: [within_collection_id.to_i] } if within_collection_id
        { where: where }
      end
    end
  end
end
