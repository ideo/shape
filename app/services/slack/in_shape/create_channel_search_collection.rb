module Slack
  module InShape
    class CreateChannelSearchCollection
      include Interactor
      include Slack::InShape::Shared

      require_in_context :channel
      delegate_to_context :channel

      def call
        find_or_create_all_content_collection
        find_or_create_search_collection
      end

      def search_collection
        CollectionCard.collection.find_by(
          parent_id: root_collection_id,
          identifier: identifier,
        )&.collection
      end

      private

      def find_or_create_all_content_collection
        return if all_content_collection.present?

        CollectionCardBuilder.call(
          params: {
            order: 0,
            identifier: ALL_CONTENT,
            collection_attributes: {
              name: 'All Content',
            },
          },
          parent_collection: root_collection,
        )
      end

      def find_or_create_search_collection
        return if search_collection.present?

        card = CollectionCardBuilder.call(
          params: {
            identifier: identifier,
            collection_attributes: {
              type: 'Collection::SearchCollection',
              name: "##{channel}",
              search_term: identifier,
            },
          },
          parent_collection: root_collection,
        )
        card.collection
      end

      def identifier
        "slack-#{channel}"
      end
    end
  end
end
