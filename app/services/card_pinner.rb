class CardPinner < SimpleService
  def initialize(card:, pinning:)
    @card = card
    @pinning = pinning
  end

  def call
    pin_card
  end

  private

  def pin_card
    template = @card.parent

    @card.update(pinned: @pinning)

    # we just pinned a template card, so update the instances
    template.queue_update_template_instances(
      updated_card_ids: [@card.id],
      template_update_action: :pin,
    )
  end
end
