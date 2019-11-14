class AddIdentifierToCollectionCards < ActiveRecord::Migration[5.2]
  def change
    add_column :collection_cards, :identifier, :string
    add_index :collection_cards, [:identifier, :parent_id]
  end
end
