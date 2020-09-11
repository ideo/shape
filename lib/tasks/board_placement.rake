namespace :board_placement do
  desc 'Fix collection card overlaps'
  task reposition_overlapping_cards: :environment do
    Collection::UserCollection.order(updated_at: :desc).where.not(num_columns: nil).find_each do |user_collection|
      next unless user_collection.board_collection?

      cards = user_collection.collection_cards
      next unless cards.any?

      overlapping_cards = CollectionGrid::Calculator.overlapping_cards(collection: user_collection)

      next unless overlapping_cards.any?

      top_left_card = CollectionGrid::Calculator.top_left_card(cards)

      next if top_left_card.nil?

      puts "repositioning overlapping cards for collection id: #{user_collection.id}"

      CollectionGrid::BoardPlacement.call(
        moving_cards: overlapping_cards,
        to_collection: user_collection,
        row: top_left_card.row,
        col: top_left_card.col,
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
    end
  end
end
