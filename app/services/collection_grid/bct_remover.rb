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
      moved = CollectionUpdater.call(@collection, collection_cards_attributes: prev_collection_cards_attributes)
      return unless moved

      broadcaster.card_attrs_updated(prev_collection_cards_attributes)
    end

    def broadcast_updates
      broadcaster.cards_archived([@placeholder_card.id])
    end

    def snapshot
      @placeholder_card.parent_snapshot.deep_symbolize_keys
    end

    def prev_collection_cards_attributes
      @prev_collection_cards_attributes ||= begin
        card_ids = snapshot[:collection_cards_attributes].pluck(:id)
        attrs = []
        ids = @collection.collection_cards
                         .where(id: card_ids)
                         .pluck(:id, :row, :col)
        ids.each do |id, row, col|
          snap = snapshot[:collection_cards_attributes].select { |i| i[:id] == id }.first
          next if snap[:row] != row || snap[:col] != col

          attrs << {
            id: snap[:id],
            row: snap[:row_was],
            col: snap[:col_was],
          }
        end
        attrs
      end
    end

    def broadcaster
      CollectionUpdateBroadcaster.new(@collection)
    end
  end
end
