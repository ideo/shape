class AddReplaceableToCollectionCards < ActiveRecord::Migration[5.1]
  def change
    add_column :collection_cards, :show_replace, :boolean, default: true
  end
end
