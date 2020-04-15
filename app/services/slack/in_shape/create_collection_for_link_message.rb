module Slack
  module InShape
    class CreateCollectionForLinkMessage
      include Interactor
      include Slack::InShape::Shared

      require_in_context :user, :timestamp, :channel, :text, :urls
      delegate :sanitize, to: 'ActionController::Base.helpers'
      delegate_to_context :user, :timestamp, :channel, :text, :urls

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
            order: 0,
            identifier: identifier,
            collection_attributes: {
              name: plain_text.first(50),
              tag_list: message_collection_tags,
              cover_type: :cover_type_carousel,
            },
          },
          parent_collection: Collection.find(all_content_collection_id)
        ).create
      end

      def create_text_card
        CollectionCardBuilder.new(
          params: {
            order: 1,
            identifier: identifier + '-text',
            item_attributes: {
              type: 'Item::TextItem',
              name: plain_text.first(50),
              data_content: QuillContentConverter.new(html_text).html_to_quill_ops
            }
          },
          parent_collection: @collection
        ).create
      end

      def create_link_card(url)
        CollectionCardBuilder.new(
          params: {
            order: 0,
            identifier: identifier + '-link',
            item_attributes: {
              type: 'Item::LinkItem',
              name: url,
              url: url
            }
          },
          parent_collection: @collection
        ).create
      end

      def message_collection_tags
        ["##{channel}", user]
      end

      def plain_text
        # sanitize(html_text)
        html_text
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
