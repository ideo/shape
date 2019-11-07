module TestResultsCollection
  class CreateItemLink
    include Interactor
    include Interactor::Schema

    schema :parent_collection,
           :item,
           :order,
           :width,
           :height,
           :created_by,
           :message

    require_in_context :parent_collection, :item

    delegate :parent_collection, :item, :width, :height, :order,
             to: :context

    before do
      context.width ||= 1
      context.height ||= 2
      context.order ||= 0
    end

    def call
      if existing_card.present?
        existing_card.update(order: order) unless existing_card.order == order
      else
        link_item
      end
    end

    private

    def existing_card
      parent_collection
        .link_collection_cards
        .where(item_id: item.id)
        .first
    end

    def link_item
      link = CollectionCard::Link.create(
        parent: parent_collection,
        item_id: item.id,
        width: width,
        height: height,
        order: order,
      )

      return link if link.persisted?

      context.fail!(
        message: link.errors.full_messages.to_sentence,
      )
    end
  end
end
