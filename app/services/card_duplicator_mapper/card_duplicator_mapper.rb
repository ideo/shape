module CardDuplicatorMapper
  class RegisterCardsNeedingMapping < SimpleService
    def initialize(card_ids:, batch_id:)
      @collection_cards = CollectionCard.where(id: card_ids)
                                        .includes(record: :collection_filters)
      @batch_id = batch_id
    end

    def call
      # Find all link cards and search collection filters
      # that are in the tree of cards to be duplicated
      @collection_cards.each do |card|
        store_card(card)
      end
    end

    private

    def store_card(card)
      if card.record.is?(Item::LinkItem)
        # Map this to new link item
        add_to_map(
          card,
          data: {
            type: :link_item,
          }
        )
      elsif card.record.is_a?(Collection)
        if card.record.collection_filters.present?
          filters_having_within = card.record.collection_filters.select do |cf|
            cf.search? && cf.within_collection_id.present?
          end

          filters_having_within.each do |cf|
            add_to_map(
              card,
              data: {
                type: :search_filter,
                collection_filter_id: cf.id,
                within_collection_id: cf.within_collection_id,
              },
            )
          end
        end
        CardDuplicatorMapper::RegisterCardsNeedingMapping.call(
          card_ids: card.record.collection_card_ids,
          batch_id: @batch_id,
        )
      end
    end

    def add_to_map(card:, data:)
      Cache.hash_set(
        @batch_id,
        card.id,
        data.to_hash,
      )
    end
  end

  class MapFromTo < SimpleService
    def initialize(from_card_id:, batch_id:)
      @from_card_id = from_card_id
      @batch_id = batch_id
    end

    def set(to_card_id)
      Cache.hash_set("#{@batch_id}_map", @from_card_id, to_card_id)
      CardDuplicatorMapper::RemapAfterDuplication.call(batch_id: @batch_id) if all_cards_mapped?
    end

    def get
      Cache.hash_get("#{@batch_id}_map", @from_card_id)
    end

    def all_cards_mapped?
      cards_needing_mapping = Cache.hash_get_all(@batch_id) || []
      cards_mapped = Cache.hash_get_all("#{@batch_id}_map") || []
      (cards_needing_mapping - cards_mapped).length.zero?
    end
  end

  class RemapAfterDuplication < SimpleService
    def initialize(batch_id:)
      @batch_id = batch_id
    end

    def call
      Cache.hash_get_all("#{@batch_id}_map").each do |from_card_id, to_card_id|
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
