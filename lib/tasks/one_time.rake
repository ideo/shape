namespace :one_time do
  desc 'Migrate from GroupHierarchy to use Group#subgroup_ids'
  task group_hierarchies_to_subgroup_ids_migration: :environment do
    Searchkick.callbacks(false) do
      GroupHierarchy
      .group(:parent_group_id, :subgroup_id)
      .pluck(:parent_group_id, :subgroup_id).each do |arr|
        parent_group = Group.find_by(id: arr[0])
        subgroup = Group.find_by(id: arr[1])
        next if parent_group.blank? || subgroup.blank?

        parent_group.add_subgroup(subgroup)
      end
    end
    Group.reindex
  end

  desc 'Fix collection card overlaps'
  task reposition_overlapping_cards: :environment do
    Collection::UserCollection.find_each do |user_collection|
      has_overlapping_cards = CollectionGrid::Calculator.has_overlapping_cards?(collection: user_collection)

      next unless has_overlapping_cards

      cards = user_collection.collection_cards

      next if cards.blank?

      top_left_card = CollectionGrid::Calculator.top_left_card(cards)

      next if top_left_card.nil?

      cards.each(&:reload)

      puts "repositioning cards for collection id: #{user_collection.id}"

      CollectionGrid::BoardPlacement.call(
        moving_cards: cards,
        to_collection: user_collection,
        row: top_left_card.row,
        col: top_left_card.col,
      )

      CollectionCard.import(
        cards.to_a,
        validate: false,
        on_duplicate_key_update: %i[row col],
      )
    end
  end
end
