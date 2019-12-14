module CardDuplicatorMapper
  class Base < SimpleService
    def initialize(batch_id:)
      @batch_id = batch_id
    end

    def card_ids_to_update
      Cache.hash_get_all(@batch_id) || []
    end

    def update_data_for_card_id(card_id:)
      Cache.hash_get(@batch_id, card_id)
    end

    def all_mappings_by_card_id
      Cache.hash_get_all("#{@batch_id}_map") || {}
    end

    def all_card_ids_mapped
      Cache.hash_get_all("#{@batch_id}_map") || []
    end

    def map_set(from_card_id:, to_card_id:)
      Cache.hash_set("#{@batch_id}_map", from_card_id, to_card_id)

      CardDuplicatorMapper::UpdateAfterDuplication.call(batch_id: @batch_id) if all_cards_mapped?
    end

    def map_get(from_card_id:)
      Cache.hash_get("#{@batch_id}_map", from_card_id)
    end

    def all_cards_mapped?
      (card_ids_to_update - all_card_ids_mapped).length.zero?
    end

    def store_card(card:, data:)
      Cache.hash_set(
        @batch_id,
        card.id,
        data.to_hash,
      )
    end
  end

  # TODO: Make a worker for this so it can be queued,
  #       although we'd want all cards map before we start duplicating

  class RegisterCardsToUpdate < Base
    def call(card_ids:)
      # Find all link cards and search collection filters
      # that are in the tree of cards to be duplicated
      load_cards(card_ids).each do |card|
        if card.record.is?(Item::LinkItem)
          register_link_card(card)
        elsif card.record.is_a?(Collection)
          register_card_with_collection_filters(card) if card.record.collection_filters.present?

          CardDuplicatorMapper::RegisterCardsToUpdate.call(
            card_ids: card.record.collection_card_ids,
            batch_id: @batch_id,
          )
        end
      end
    end

    private

    def load_cards(card_ids)
      CollectionCard.where(id: card_ids)
                    .includes(
                      :item,
                      collection: :collection_filters,
                    )
    end

    def register_link_card(card)
      store_card(
        card,
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
        add_to_map(
          card,
          data: {
            type: :search_filter,
            collection_filter_id: collection_filter.id,
            within_collection_id: collection_filter.within_collection_id,
          },
        )
      end
    end
  end

  # TODO: May want to turn this into a worker-queued operation
  class UpdateAfterDuplication < SimpleService
    def call
      all_mappings.each do |from_card_id, to_card_id|
        next unless card_needs_remapping?(from_card_id)

        data = Cache.hash_get(@batch_id, from_card_id)
        send(
          "remap_#{data['type']}",
          from_card_id: from_card_id,
          to_card_id: to_card_id,
          data: data
        )
      end
    end

    private

    def all_mappings
      CardDuplicatorMapper::MapDuplicatedRecord.all_mappings(@batch_id)
    end

    def card_needs_remapping?(from_card_id)
      Cache.hash_exists?(
        @batch_id, from_card_id
      )
    end

    def remap_search_filter(from_card_id:, to_card_id:, data:)
      new_collection_card_id = Map.new(
        from_card_id: from_card_id,
        batch_id: @batch_id,
      ).get

      new_card = CollectionCard.find(new_collection_card_id).first

      collection_filter.reassign_within!(
        from_collection_id: data['within_collection_id'],
        to_collection_id: new_card.collection_id,
      )
    end

    def remap_link_item(from_card_id:, to_card_id:, data:)
      # Map link card from old to new record
      to_card = CollectionCard.find(to_card_id)

      collection_card.update(
        item_id: to_card.item_id,
        collection_id: to_card.collection_id,
      )
    end
  end
end
