module CardDuplicatorMapper
  class DuplicateCards < Base
    def initialize(batch_id:)
      @batch_id = batch_id
    end

    def call
      duplicate_all_cards
      duplicate_all_records
    end

    private

    def duplicate_all_cards
      CollectionCard.where(id: duplicated_card_ids).find_each do |card|
        # Do we still need all these attributes and methods?
        card.duplicate!(
          for_user: @for_user,
          parent: @parent_collection,
          placement: placement,
          system_collection: @system_collection,
          synchronous: @synchronous,
          placeholder: placeholder,
          batch_id: @batch_id,
          building_template_instance: @building_template_instance,
        )
      end
    end

    def duplicate_all_records
      duplicated_card_data = duplicated_cards
      original_card_ids = duplicated_card_data.keys
      original_cards = CollectionCard.where(id: original_card_ids).includes(:item, :collection)
      original_cards.find_each do |original_card|
        original_card.record.duplicate!(
          parent_collection_card_id: duplicated_card_data[original_card.id]
          ...
        )
      end
    end
  end
end
