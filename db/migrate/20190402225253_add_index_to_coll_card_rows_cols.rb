class AddIndexToCollCardRowsCols < ActiveRecord::Migration[5.1]
  def change
    add_index :collection_cards, [:order, :row, :col]
  end
end
