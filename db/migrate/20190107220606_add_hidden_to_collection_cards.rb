class AddHiddenToCollectionCards < ActiveRecord::Migration[5.1]
  def change
    add_column :collection_cards, :hidden, :boolean, default: false
  end
end
