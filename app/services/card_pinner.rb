class CardPinner < SimpleService
  def initialize(card:, pinning:)
    @card = card
    @pinning = pinning
  end

  def call
    reorder_cards!
  end

  def reorder_cards!
    template = @card.parent

    if @pinning
      # pinning inserts card at the back of pinned items
      last_pinned_order = template.collection_cards.pinned&.last&.order || 0
      @card.update(pinned: true, order: last_pinned_order)
    else
      # unpinning inserts at the front of unpinned items
      next_to_last_pinned_order = template.collection_cards.pinned&.last&.order ? template.collection_cards.pinned.last.order + 1 : 0
      first_unpinned_order = template.collection_cards.unpinned&.first&.order || next_to_last_pinned_order
      @card.update(pinned: false, order: first_unpinned_order)
    end

    # we just pinned a template card, so update the instances
    template.queue_update_template_instances(
      updated_card_ids: [@card.id],
      template_update_action: 'pin',
    )

    template.reorder_cards!
    template.reload
  end
end
