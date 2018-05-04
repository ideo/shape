class CollectionTree < SimpleService
  def initialize(collection)
    @collection = collection
    @cards = 0
    @items = 0
    @collections = 0
    @links = 0
  end

  def call
    generate_tree
  end

  private

  def generate_tree
    @collection.collection_cards.each do |card|
      @cards += 1
      if card.link?
        @links += 1
        next
      end
      if card.item_id.present?
        @items += 1
      elsif card.collection_id.present?
        @collections += 1
        combine_tree CollectionTree.call(card.collection)
      end
    end
    {
      cards: @cards,
      collections: @collections,
      items: @items,
      links: @links,
    }
  end

  def combine_tree(tree)
    @cards += tree[:cards]
    @collections += tree[:collections]
    @items += tree[:items]
    @links += tree[:links]
  end
end
