module CardDuplicatorMapper
  class RemapCollectionFilter < Base
    def initialize(batch_id:, original_card_id:, to_card_id:, data:)
      @batch_id = batch_id
      @original_card_id = original_card_id
      @to_card_id = to_card_id
      @data = data
    end

    def call
      return if duplicated_filter.blank?

      duplicated_filter.reassign_within!(
        from_collection_id: original_search_target.id,
        to_collection_id: search_target_duplicate_card.collection_id,
      )
    end

    private

    def duplicated_filter
      new_card.collection.collection_filters.find do |new_filter|
        new_filter.within_collection_id == original_search_target.id
      end
    end

    def original_search_target
      @original_search_target ||= Collection.where(id: @data['within_collection_id'])
                                            .includes(:parent_collection_card)
                                            .first
    end

    def search_target_duplicate_card
      search_target_duplicate_card_id = duplicate_id_for_card_id(
        original_card_id: original_search_target.parent_collection_card.id,
      )

      CollectionCard.find(search_target_duplicate_card_id)
    end

    def new_card
      @new_card ||= CollectionCard.where(id: @to_card_id)
                                  .includes(collection: :collection_filters)
                                  .first
    end
  end
end
