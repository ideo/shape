module CardDuplicatorMapper
  class RemapLinkedCards < Base
    def initialize(batch_id:)
      @batch_id = batch_id
    end

    def call
      duplicated_cards.each do |original_card_id, to_card_id|
        remap_cards(original_card_id, to_card_id)
      end
    end

    def remap_cards(original_card_id, to_card_id)
      return unless card_needs_remapping?(original_card_id, to_card_id)

      data = linked_card_data(card_id: original_card_id)
      return if data['remapper'].blank?

      klass = data['remapper'].safe_constantize
      unless klass.is_a?(Class)
        raise "Card remapper does not exist '#{data['remapper']}' "\
              "for card: #{original_card_id} to card: #{to_card_id}"
      end

      klass.call(
        batch_id: @batch_id,
        original_card_id: original_card_id,
        to_card_id: to_card_id,
        data: data,
      )
    end

    private

    def card_needs_remapping?(original_card_id, to_card_id)
      # Card is the same, no re-mapping needed
      return false if original_card_id == to_card_id

      # Check if the card was marked as a linked card
      linked_card?(card_id: original_card_id)
    end
  end
end
