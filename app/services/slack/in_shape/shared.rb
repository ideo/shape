module Slack
  module InShape
    module Shared
      def root_collection_id
        ENV['SLACK_IN_SHAPE_COLLECTION_ID']
      end

      def identifier_for_channel(channel)
        "slack-#{channel}"
      end

      def all_content_collection_id
        CollectionCard.find_by(
          parent_id: 1916091,
          identifier: 'all-content'
        )&.collection_id
      end
    end
  end
end
