# The CardDuplicatorMapper services are used to map
# cards that reference other records (link cards and search collection filters),
# and then re-map them if the record they are pointing to is also duplicated.
#
# The process is:
# 1) Map all cards that will be duplicated and store in redis hash
# 2) Duplicate all cards, and while doing so, register the original and duplicated card
# 3) When finished duplicating, re-map cards to point to their duplicate.

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

    # Register a card that has been duplicated so it can be remappeds
    def register_duplicated_card(original_card_id:, to_card_id:)
      Cache.hash_set("#{@batch_id}_duplicated_cards", original_card_id, to_card_id)
      # TODO: How to ensure all cards were mapped or if duplication failed
      return unless all_cards_mapped?

      CardDuplicatorMapper::RemapLinkedCards.call(batch_id: @batch_id)
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

    def register_linked_card(card_id:, data:)
      Cache.hash_set(
        "#{@batch_id}_linked_cards",
        card_id,
        data.to_hash,
      )
    end

    def expire_data_in_one_day!
      Cache.expire("#{@batch_id}_linked_cards", 1.day.to_i)
      Cache.expire("#{@batch_id}_duplicated_cards", 1.day.to_i)
    end

    def clear_cached_data!
      Cache.delete("#{@batch_id}_linked_cards")
      Cache.delete("#{@batch_id}_duplicated_cards")
    end
  end
end
