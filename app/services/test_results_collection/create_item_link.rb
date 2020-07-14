module TestResultsCollection
  class CreateItemLink
    include Interactor
    include Interactor::Schema
    include CollectionCardBuilderHelpers

    schema :parent_collection,
           :item,
           :order,
           :width,
           :height,
           :created_by,
           :identifier,
           :message

    require_in_context :parent_collection, :item

    delegate :parent_collection,
             :item,
             :width,
             :height,
             :order,
             :identifier,
             to: :context

    before do
      context.width = 1 if width.nil?
      context.height = 2 if height.nil?
      context.order = 0 if order.nil?
    end

    def call
      return existing_card if existing_card.present?

      link_item
    end

    private

    def existing_card
      if identifier.present?
        parent_collection.link_collection_cards.identifier(identifier).first
      else
        parent_collection.link_collection_cards.where(item_id: item.id).first
      end
    end

    def link_item
      # Should this use CollectionCardBuilder?
      link = create_card(
        type: 'link',
        parent_collection: parent_collection,
        params: {
          item_id: item.id,
          width: width,
          height: height,
          identifier: identifier,
        },
      )

      return link if link.persisted?

      context.fail!(
        message: link.errors.full_messages.to_sentence,
      )
    end
  end
end
