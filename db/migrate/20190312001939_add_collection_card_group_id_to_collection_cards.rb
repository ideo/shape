class AddCollectionCardGroupIdToCollectionCards < ActiveRecord::Migration[5.1]
  def change
    add_column :collection_cards, :collection_card_group_id, :integer
  end
end
