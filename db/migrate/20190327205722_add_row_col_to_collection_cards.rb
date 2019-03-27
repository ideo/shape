class AddRowColToCollectionCards < ActiveRecord::Migration[5.1]
  def change
    add_column :collection_cards, :row, :integer
    add_column :collection_cards, :col, :integer
  end
end
