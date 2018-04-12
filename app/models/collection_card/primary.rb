class CollectionCard
  class Primary < CollectionCard
    archivable with: %i[collection item]
    after_archive :decrement_card_orders!

    belongs_to :collection,
               optional: true,
               inverse_of: :parent_collection_card
    belongs_to :item,
               optional: true,
               inverse_of: :parent_collection_card

    validate :card_is_only_primary_card, if: :new_record?

    def check_if_primary_card_is_unique?
      !link? && (new_record? || reference_changed?)
    end

    def card_is_only_primary_card
      # look for an existing primary CollectionCard that is already pointed to this record
      return unless record.present? && record.persisted?
      return unless CollectionCard::Primary.where("#{record_type}_id": record.id).count.positive?
      errors.add(record_type, 'already has a primary card')
    end
  end
end
