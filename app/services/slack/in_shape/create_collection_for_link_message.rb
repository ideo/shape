module Slack
  module InShape
    class CreateCollectionForLinkMessage
      delegate :sanitize, to: 'ActionView::Helpers::SanitizeHelper'
      include Interactor

      require_in_context :user, :timestamp, :channel, :text, :urls

      def call
        # Exit if we've already created this message card
        # TODO for the future, what if a new thread message was added?
        return if find_message_collection_card.present?

        @collection = create_collection
        create_text_card
        urls.each do |url|
          create_link_card(url)
        end
      end

      private

      def find_message_collection_card
        CollectionCard.find_by(
          parent_id: all_content_collection_id,
          identifier: identifier,
        )
      end

      def create_collection
        # parent is all_content_collection_id
        CollectionCardBuilder.new(
          params: {
            identifier: identifier,
            collection: {
              name: plain_text.first(50),
              tag_list: message_collection_tags,
            }
          },
          parent_collection: Collection.find(all_content_collection_id)
        )
      end

      def create_text_card
        CollectionCardBuilder.new(
          params: {
            identifier: identifier + '-text',
            item: {
              type: 'Item::TextItem',
              name: plain_text.first(50),
              data_content: QuillContentConverter.new(html_text).html_to_quill_ops
            }
          },
          parent_collection: @collection
        )
      end

      def create_link_card(url)
        CollectionCardBuilder.new(
          params: {
            identifier: identifier + '-link',
            item: {
              type: 'Item::LinkItem',
              name: url,
              url: url
            }
          },
          parent_collection: @collection
        )
      end

      def message_collection_tags
        ["##{channel.to_url}", user]
      end

      def plain_text
        sanitize(html_text)
      end

      def html_text
        renderer = Redcarpet::Markdown.new(Redcarpet::Render::HTML.new)
        renderer.render(text).html_safe
      end

      def identifier
        "#{channel}-#{user}-#{timestamp}"
      end
    end
  end
end
