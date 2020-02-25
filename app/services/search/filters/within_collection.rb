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
        return where if within_collection_id.nil?

        # have to look up the id first to check if it's a SubmissionBox
        collection = Collection.find_by_id(within_collection_id)
        if collection&.is_a?(Collection::SubmissionBox)
          where[:parent_id] = collection.submissions_collection&.id
        else
          where[:parent_ids] = { all: [within_collection_id] }
        end
        { where: where }
      end
    end
  end
end
