class Search
  module Filters
    class RecordId < Base
      # matches either ID/numeric only e.g. "131"
      # or a collection/item slug e.g. "131-slug-name"
      REGEXP = /\A(\d+)(\-[\-a-z]*)?\z/.freeze

      def options
        id = @query.scan(REGEXP).flatten.first
        { where: { id: id } }
      end
    end
  end
end
