class AddImageContainToCollectionCards < ActiveRecord::Migration[5.1]
  def change
    add_column :collection_cards, :image_contain, :boolean, default: false
  end
end
