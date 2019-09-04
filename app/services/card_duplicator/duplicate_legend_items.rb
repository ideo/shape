module CardDuplicator
  class DuplicateLegendItems
    include Interactor
    require_in_context :duplicated_cards, :to_collection
    delegate_to_context :duplicated_cards, :to_collection

    def call
      duplicate_legend_items
    end

    private

    def duplicate_legend_items
      mover = LegendMover.new(
        to_collection: to_collection,
        cards: (to_collection.collection_cards + duplicated_cards).uniq,
        action: 'duplicate',
      )

      return unless mover.call

      context.duplicated_cards += mover.legend_item_cards
    end
  end
end
