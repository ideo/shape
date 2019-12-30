class CardPinner < SimpleService
  def initialize(card:, template:, pinning:)
    @card = card
    @template = template
    @pinning = pinning
  end

  def call
    reorder_cards!
  end

  def reorder_cards!
    if @pinning
      # pinning inserts at the front
      @card.update(pinned: true, order: 0)
    else
      # unpinning inserts at the front of unpinned items
      unpinned_order = @template.unpinned&.first&.order || 0
      @card.update(pinned: false, order: unpinned_order)
    end
    @template.reorder_cards!
    @template.collection_cards.reload
  end
end
