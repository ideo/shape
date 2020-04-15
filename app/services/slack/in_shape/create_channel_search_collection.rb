module Slack
  module InShape
    class CreateChannelSearchCollection
      include Interactor

      require_in_context :channel

      def call
        @collection = find_existing_collection
        @collection ||= create_collection
      end

      private

      def find_existing_collection
        CollectionCard.collection.find_by(
          parent_id: root_collection_id,
          identifier: identifier
        )
      end

      def create_collection
        CollectionCardBuilder.new(
          params: {
            name: "##{channel}",
            search_term: "##{channel}",
          },
          parent_collection: Collection.find(root_collection_id)
        )
      end

      def identifier
        "slack-#{channel}"
      end
    end
  end
end
