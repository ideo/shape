module CardDuplicatorMapper
  class FindLinkedCards < Base
    def initialize(
      card_ids:,
      batch_id:,
      for_user: nil,
      system_collection: false
    )
      @card_ids = card_ids
      @batch_id = batch_id
      @for_user = for_user
      @system_collection = system_collection
    end

    def call
      all_link_cards.each do |card|
        register_link_card(card)
      end

      all_search_collection_filters_by_collection_id.each do |collection_id, collection_filters|
        card_id = Collection.where(id: collection_id)
                            .joins(:parent_collection_card)
                            .first
                            .parent_collection_card
                            .id
        collection_filters.each do |collection_filter|
          register_card_with_collection_filter(card_id, collection_filter)
        end
      end

      expire_data_in_one_day!
    end

    private

    def all_link_cards
      return @all_link_cards if @all_link_cards.present?

      links = filter_cards_for_user(
        CollectionCard::Link.where(
          parent_id: all_collections.map(&:id),
        ),
      )
      links += load_cards.select(&:link?)
      @all_link_cards = links.uniq
    end

    def all_search_collection_filters_by_collection_id
      return @all_search_collection_filters if @all_search_collection_filters.present?

      search_collection_filters = CollectionFilter.search.where(
        collection_id: @all_collections.map(&:id),
      ).select { |cf| cf.within_collection_id.present? }

      @all_search_collection_filters = search_collection_filters.each_with_object({}) do |cf, h|
        h[cf.collection_id] ||= []
        h[cf.collection_id] << cf
      end
    end

    def all_collections
      return @all_collections if @all_collections.present?

      all_collection_cards = load_cards.select do |card|
        card.record.is_a?(Collection)
      end

      @all_collections = all_collection_cards.map do |card|
        [card.record] + card.record.all_child_collections
      end.flatten
    end

    def all_items
      return @all_items if @all_items.present?

      @all_items = load_cards.map do |card|
        if card.record.is_a?(Item)
          card.record
        elsif card.record.is_a?(Collection)
          card.record.all_child_items
        end
      end.flatten
    end

    def recursively_find_linked_cards(children_card_ids)
      CardDuplicatorMapper::FindLinkedCards.call(
        card_ids: children_card_ids,
        batch_id: @batch_id,
        for_user: @for_user,
        system_collection: @system_collection,
      )
    end

    def filter_cards_for_user(cards_scope)
      return cards_scope if @for_user.blank? || @system_collection

      CollectionCardFilter::ForUser.call(
        cards_scope: cards_scope,
        user: @for_user,
      )
    end

    def load_cards
      @load_cards ||= filter_cards_for_user(
        CollectionCard.where(id: @card_ids)
                      .active
                      .includes(
                        :item,
                        :collection,
                      ),
      )
    end

    def register_link_card(card)
      # Only register if this link card points to an item that will be duplicated
      return if !all_collections.include?(card.record) && !all_items.include?(card.record)

      record_parent_collection_card = card.record.parent_collection_card

      register_linked_card(
        card_id: card.id,
        data: {
          remapper: 'CardDuplicatorMapper::RemapLinkItem',
          record_card_id: record_parent_collection_card.id.to_s,
        },
      )
      # Also register the linked record's card
      # So that we wait for it to be duplicated before re-linking
      register_linked_card(
        card_id: record_parent_collection_card.id,
        data: {}, # No remapper is necessary
      )
    end

    def register_card_with_collection_filter(card_id, collection_filter)
      register_linked_card(
        card_id: card_id,
        data: {
          remapper: 'CardDuplicatorMapper::RemapSearchFilter',
          within_collection_id: collection_filter.within_collection_id,
        },
      )
    end
  end
end
