class RowInserter < SimpleService
  attr_reader :errors

  def initialize(
    card:,
    direction: 'below'
  )
    @card = card
    @parent_collection = card.parent
    @direction = direction
    @errors = []
  end

  def call
    return false unless @card.parent.present?

    cards = @direction == 'below' ? select_all_cards_below : select_all_cards_above
    move_all_cards_in_direction(cards)
  end

  private

  def move_all_cards_in_direction(cards)
    cards.update_all('row = row + 1')
  end

  def select_all_cards_below
    @parent_collection.collection_cards.where(row: (@card.row + 1)..Float::INFINITY)
  end

  def select_all_cards_above
    @parent_collection.collection_cards.where(row: (@card.row)..Float::INFINITY)
  end
end
