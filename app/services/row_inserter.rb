class RowInserter < SimpleService
  attr_reader :errors

  def initialize(
    row: 0,
    collection:,
    action: :insert_row
  )
    @row = row
    @parent_collection = collection
    @action = action
    @errors = []
  end

  def call
    move_all_cards_in_direction
  end

  private

  def move_all_cards_in_direction
    movement = @action.to_sym == :insert_row ? 1 : -1
    select_all_cards_below.update_all([
      "row = row + #{movement}, updated_at = ?",
      Time.current,
    ])
  end

  def select_all_cards_below
    @parent_collection.collection_cards.where(
      CollectionCard.arel_table[:row].gt(@row),
    )
  end
end
