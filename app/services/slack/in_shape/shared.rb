module Slack
  module InShape
    module Shared
      ALL_CONTENT = 'all-content'.freeze

      def root_collection_id
        ENV['SLACK_IN_SHAPE_COLLECTION_ID']
      end

      def root_collection
        @root_collection ||= Collection.find(root_collection_id)
      end

      def identifier_for_channel(channel)
        "slack-#{channel}"
      end

      def all_content_collection_id
        CollectionCard.find_by(
          parent_id: root_collection_id,
          identifier: ALL_CONTENT,
        )&.collection_id
      end

      def all_content_collection
        return if all_content_collection_id.nil?

        @all_content_collection ||= Collection.find(all_content_collection_id)
      end
    end
  end
end
