class RowInserter < SimpleService
  attr_reader :errors

  def initialize(
    row:,
    collection:,
    action: 'add'
  )
    @row = row
    @parent_collection = collection
    @action = action
    @errors = []
  end

  def call
    cards = select_all_cards_below
    move_all_cards_in_direction(cards, @action)
  end

  private

  def move_all_cards_in_direction(cards, action)
    movement = action == 'add' ? 1 : -1
    cards.update_all("row = row + #{movement}")
  end

  def select_all_cards_below
    @parent_collection.collection_cards.where(row: (@row + 1)..Float::INFINITY)
  end
end
