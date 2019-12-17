module CardDuplicatorMapper
  class FindLinkedCards < Base
    def initialize(card_ids:, batch_id:)
      @batch_id = batch_id
      @card_ids = card_ids
    end

    def call
      # Find all link cards and search collection filters
      # that are in the tree of cards to be duplicated
      load_cards.each do |card|
        if card.is_a?(CollectionCard::Link)
          register_link_card(card)
        elsif card.record.is_a?(Collection)
          register_card_with_collection_filters(card) if card.record.collection_filters.present?

          CardDuplicatorMapper::FindLinkedCards.call(
            card_ids: card.record.collection_card_ids,
            batch_id: @batch_id,
          )
        end
      end
    end

    private

    def load_cards
      CollectionCard.where(id: @card_ids)
                    .includes(
                      :item,
                      collection: :collection_filters,
                    )
    end

    def register_link_card(card)
      register_linked_card(
        card_id: card.id,
        data: {
          type: :link_item,
        },
      )
    end

    def register_card_with_collection_filters(card)
      filters_having_within = card.record.collection_filters.select do |collection_filter|
        collection_filter.search? && collection_filter.within_collection_id.present?
      end

      filters_having_within.each do |collection_filter|
        register_linked_card(
          card_id: card.id,
          data: {
            type: :search_filter,
            collection_filter_id: collection_filter.id.to_s,
            within_collection_id: collection_filter.within_collection_id,
          },
        )
      end
    end
  end
end
