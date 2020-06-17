module CollectionCardFilter
  class ForPublic < Base
    def initialize(cards_scope:, collection_order: nil, ids_only: false)
      @cards_scope = cards_scope
      # Needed for fields method
      @collection_order = collection_order
      @ids_only = ids_only
    end

    def call
      apply_filter
    end

    private

    def apply_filter
      @cards_scope
        .left_joins(:item, :collection)
        .select(*fields)
        .where(
          "(collection_cards.item_id IS NOT NULL AND items.cached_attributes->'cached_inheritance'->>'private'='false') OR " \
          "(collection_cards.collection_id IS NOT NULL AND collections.cached_attributes->'cached_inheritance'->>'private'='false')",
        )
        .distinct
    end
  end
end
