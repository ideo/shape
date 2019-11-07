module TestResultsCollection
  class CreateMediaItemLink
    include Interactor
    include Interactor::Schema

    schema :test_results_collection,
           :item,
           :order,
           :created_by,
           :message

    require_in_context :test_results_collection

    delegate :test_results_collection,
             to: :context

    def call
      debugger
      if existing_card.present?
        existing_card.update(order: order) unless existing_card.order == order
      else
        link_media_item
      end
    end

    private

    def existing_card
      test_results_collection
        .link_collection_cards
        .where(item_id: item.id)
        .first
    end

    def link_media_item
      link = CollectionCard::Link.create(
        parent: test_results_collection,
        item_id: item.id,
        width: 1,
        height: 2,
        order: -1,
      )

      return link if link.persisted?

      context.fail!(
        message: link.errors.full_messages.to_sentence,
      )
    end
  end
end
