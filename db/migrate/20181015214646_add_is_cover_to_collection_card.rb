class AddIsCoverToCollectionCard < ActiveRecord::Migration[5.1]
  def change
    add_column :collection_cards, :is_cover, :boolean, default: false
  end
end
