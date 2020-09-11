namespace :board_placement do
  desc 'Fix collection card overlaps'
  task reposition_overlapping_cards: :environment do
    Collection::UserCollection.find_in_batches.each do |batch|
      batch.each do |user_collection|
        next unless user_collection.board_collection? && user_collection.collection_cards.any?

        fix_overlapping_user_collection(user_collection)
      end
    end
  end
end

def fix_overlapping_user_collection(user_collection)
  # check for empty rows created by C∆
  check_for_empty_rows(user_collection)

  overlapping_cards = CollectionGrid::Calculator.overlapping_cards(collection: user_collection)
  return unless overlapping_cards.any?

  CollectionGrid::BoardPlacement.call(
    moving_cards: overlapping_cards,
    to_collection: user_collection,
  )

  begin
    CollectionCard.import(
      overlapping_cards.to_a,
      validate: false,
      on_duplicate_key_update: %i[row col],
    )
  rescue ActiveRecord::StatementInvalid
    puts "Error with placing cards collection id: #{user_collection.id}"
  end

  # check one more time now that overlaps are gone
  check_for_empty_rows(user_collection)
end

def check_for_empty_rows(collection)
  # special check for empty rows caused by C∆
  cards = collection.reload.collection_cards
  return unless cards.first.row >= 2

  CollectionGrid::RowInserter.call(
    row: -1,
    collection: collection,
    movement: -2,
  )
end
