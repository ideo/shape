module CardDuplicatorMapper
  class Base
    def initialize(batch_id:)
      @batch_id = batch_id
    end

    # This is for all sub-classes that inherit from this class,
    # to act like SimpleService without this class being a SimpleService
    def self.call(*args)
      new(*args).call
    end

    # A hash of all cards that have been marked that they
    # may need to be updated after duplication is complete
    def linked_cards
      Cache.hash_get_all("#{@batch_id}_linked_cards").presence || {}
    end

    def linked_card_data(card_id:)
      Cache.hash_get(
        "#{@batch_id}_linked_cards", card_id
      )
    end

    def linked_card?(card_id:)
      Cache.hash_exists?(
        "#{@batch_id}_linked_cards", card_id
      )
    end

    def linked_card_ids
      linked_cards.keys
    end

    # A hash that maps from the original card id to the duplicated card id
    def duplicated_cards
      Cache.hash_get_all("#{@batch_id}_duplicated_cards").presence || {}
    end

    def duplicated_card_ids
      duplicated_cards.keys
    end

    def duplicate_id_for_card_id(original_card_id:)
      Cache.hash_get("#{@batch_id}_duplicated_cards", original_card_id)
    end

    def all_cards_mapped?
      (linked_card_ids - duplicated_card_ids).length.zero?
    end

    def register_duplicated_card(original_card_id:, to_card_id:)
      Cache.hash_set("#{@batch_id}_duplicated_cards", original_card_id, to_card_id)
      return unless all_cards_mapped?

      CardDuplicatorMapper::RemapLinkedCards.call(batch_id: @batch_id)
    end

    def register_linked_card(card_id:, data:)
      Cache.hash_set(
        "#{@batch_id}_linked_cards",
        card_id,
        data.to_hash,
      )
    end

    def clear_cached_data!
      Cache.delete("#{@batch_id}_linked_cards")
      Cache.delete("#{@batch_id}_duplicated_cards")
    end
  end
end
