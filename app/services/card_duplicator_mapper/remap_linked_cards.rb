# TODO: May want to turn this into a worker-queued operation

module CardDuplicatorMapper
  class RemapLinkedCards < Base
    def initialize(batch_id:)
      @batch_id = batch_id
    end

    def call
      duplicated_cards.each do |original_card_id, to_card_id|
        next unless card_needs_remapping?(original_card_id, to_card_id)

        data = linked_card_data(card_id: original_card_id)

        unless defined?("remap_#{data['type']}")
          raise "Card remapping not defined: #{data['type']}"
        end

        send(
          "remap_#{data['type']}",
          original_card_id: original_card_id,
          to_card_id: to_card_id,
          data: data,
        )
      end

      clear_cached_data!
    end

    private

    def card_needs_remapping?(original_card_id, to_card_id)
      # Card is the same, no re-mapping needed
      return false if original_card_id == to_card_id

      # Check if the card was marked as a linked card
      linked_card?(card_id: original_card_id)
    end

    def remap_search_filter(original_card_id:, to_card_id:, data:)
      new_collection_card_id = duplicate_id_for_card_id(
        original_card_id: original_card_id,
      )
      new_card = CollectionCard.where(id: new_collection_card_id)
                               .includes(collection: :collection_filters)
                               .first

      original_filter = CollectionFilter.find(data['collection_filter_id'])

      duplicated_filter = new_card.collection.collection_filters.find do |new_filter|
        new_filter.text == original_filter.text
      end

      duplicated_filter&.reassign_within!(
        from_collection_id: data['within_collection_id'],
        to_collection_id: new_card.collection_id,
      )
    end

    def remap_link_item(original_card_id:, to_card_id:, data:)
      debugger
      duplicated_link_card = CollectionCard.where(id: to_card_id)
                                           .includes(item: :parent_collection_card, collection: :parent_collection_card)
                                           .first

      linked_record = duplicated_link_card.record
      linked_record_card = linked_record.parent_collection_card
      linked_record_was_duplicated = duplicated_cards.values.map(&:to_i).include?(linked_record_card.id)

      # If the record was duplicated in this batch, link to new record
      return unless linked_record_was_duplicated

      # Map link card from old to new record
      duplicated_link_card.update(
        item_id: linked_record_card.item_id,
        collection_id: linked_record_card.collection_id,
      )
    end
  end
end
