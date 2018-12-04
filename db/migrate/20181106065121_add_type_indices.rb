class AddTypeIndices < ActiveRecord::Migration[5.1]
  def change
    add_index :items, :type
    add_index :collections, :type
    add_index :collection_cards, :type
  end
end
