class CardSelector < SimpleService
  attr_reader :errors
  attr_reader :selecting_cards

  def initialize(
    card:,
    direction: 'bottom'
  )
    @card = card
    @parent_collection = card.parent
    @direction = direction
    # retain array of cards being moved
    @selecting_cards = []
    @errors = []
  end

  def call
    return false unless @card.parent.present?

    select_cards
    @selecting_cards
  end

  private

  # this is the same logic as CardMover::select_existing_cards
  def select_cards
    # select cards that are only editable by the user and is not hidden?
    # pinned/unpinned?

    cards = CollectionGrid::Calculator.uninterupted_cards_below(
      selected_card: @card,
      collection: @parent_collection,
    )
    cards.reject(&:pinned)
    @selecting_cards = cards.to_a
  end
end
