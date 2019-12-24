class Search
  module Filters
    class RecordId < Base
      REGEXP = /\A(\d+)/.freeze

      def options
        id = @query.scan(REGEXP).flatten.first
        { where: { id: id } }
      end
    end
  end
end
