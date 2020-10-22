class AddCoverCardIdToCollectionCards < ActiveRecord::Migration[5.2]
  def change
    add_column :collection_cards, :cover_card_id, :integer, default: nil
  end
end
