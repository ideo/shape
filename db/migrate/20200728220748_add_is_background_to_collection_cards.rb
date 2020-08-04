class AddIsBackgroundToCollectionCards < ActiveRecord::Migration[5.2]
  def change
    add_column :collection_cards, :is_background, :boolean, default: false
  end
end
