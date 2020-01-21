module CardDuplicatorMapper
  class RemapLinkItem < Base
    def initialize(batch_id:, original_card_id:, to_card_id:, data:)
      @batch_id = batch_id
      @original_card_id = original_card_id
      @to_card_id = to_card_id
      @data = data
    end

    def call
      # Return if the linked record was not duplicated
      return if record_duplicated_card.blank?

      # Map link card from old to new record
      duplicated_link_card.update(
        item_id: record_duplicated_card.item_id,
        collection_id: record_duplicated_card.collection_id,
      )
    end

    private

    def duplicated_link_card
      @duplicated_link_card ||= CollectionCard.find(@to_card_id)
    end

    def record_duplicated_card
      return @record_duplicated_card if @record_duplicated_card.present?

      record_duplicated_card_id = duplicate_id_for_card_id(
        original_card_id: @data['record_card_id'],
      )

      @record_duplicated_card = CollectionCard.find_by(id: record_duplicated_card_id)
    end
  end
end
