module Slack
  module InShape
    class CreateCollectionForLinkMessage
      include Interactor
      include Slack::InShape::Shared

      require_in_context :user, :timestamp, :channel, :html_text, :urls
      delegate_to_context :user, :timestamp, :channel, :html_text, :urls

      def call
        # Exit if we've already created this message card
        # TODO for the future, what if a new thread message was added?
        return if find_message_collection_card.present?

        # if for whatever reason this service was triggered before the initial one
        return if all_content_collection.blank?

        create_collection
        urls.each do |url|
          create_link_card(url)
        end
        create_text_card
      end

      private

      def find_message_collection_card
        CollectionCard.active.find_by(
          parent_id: all_content_collection_id,
          identifier: identifier,
        )
      end

      def create_collection
        # parent is all_content_collection_id
        card = CollectionCardBuilder.call(
          params: {
            order: 0,
            identifier: identifier,
            collection_attributes: {
              name: plain_text.first(50),
              tag_list: message_collection_tags,
              cover_type: :cover_type_carousel,
            },
          },
          parent_collection: all_content_collection,
        )
        @collection = card.collection
      end

      def create_link_card(url)
        CollectionCardBuilder.call(
          params: {
            identifier: identifier + '-link',
            item_attributes: {
              type: 'Item::LinkItem',
              name: url,
              url: url,
            },
          },
          parent_collection: @collection,
        )
      end

      def create_text_card
        CollectionCardBuilder.call(
          params: {
            identifier: identifier + '-text',
            item_attributes: {
              type: 'Item::TextItem',
              name: plain_text.first(50),
              data_content: QuillContentConverter.new(html_text).html_to_quill_ops,
            },
          },
          parent_collection: @collection,
        )
      end

      def message_collection_tags
        ["slack-#{channel}", user]
      end

      def identifier
        "#{channel}-#{user}-#{timestamp}"
      end

      def plain_text
        ActionController::Base.helpers.strip_tags(html_text).strip
      end
    end
  end
end
