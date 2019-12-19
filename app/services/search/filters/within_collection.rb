class Search
  module Filters
    class WithinCollection < Base
      REGEXP = /within\:(\d+)/i.freeze

      def within_collection_id
        id = @query.scan(REGEXP).flatten[0]
        return if id.nil?

        id.to_i
      end

      def options
        where = {}
        where[:parent_ids] = { all: [within_collection_id] } if within_collection_id
        { where: where }
      end
    end
  end
end
