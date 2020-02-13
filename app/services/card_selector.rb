class CardSelector < SimpleService
  attr_reader :errors

  def initialize(
    card:,
    direction: 'bottom',
    user:
  )
    @card = card
    @parent_collection = card.parent
    @direction = direction
    @user = user
    @errors = []
  end

  def call
    return false unless @card.parent.present?

    select_cards
  end

  private

  def select_cards
    cards = CollectionGrid::Calculator.uninterrupted_cards_below(
      selected_card: @card,
      collection: @parent_collection,
    )
    cards.reject { |card| !card.can_view?(@user) || card.pinned_and_locked? }
  end
end
