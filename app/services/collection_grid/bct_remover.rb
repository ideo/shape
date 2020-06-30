# insert or remove a 1x1 square on the foamcore grid
module CollectionGrid
  class BctRemover < SimpleService
    def initialize(placeholder_card:)
      @placeholder_card = placeholder_card
      @collection = placeholder_card.parent
    end

    def call
      move_cards_back
      broadcast_updates
    end

    private

    def move_cards_back
      # use this service so that template updates also flow through
      CollectionUpdater.call(@collection, snapshot)
      broadcaster.card_attrs_updated(snapshot[:collection_cards_attributes])
    end

    def broadcast_updates
      broadcaster.cards_archived([@placeholder_card.id])
    end

    def snapshot
      @placeholder_card.parent_snapshot.deep_symbolize_keys
    end

    def broadcaster
      CollectionUpdateBroadcaster.new(@collection)
    end
  end
end
