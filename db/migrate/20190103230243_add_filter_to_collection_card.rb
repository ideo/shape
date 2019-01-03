class AddFilterToCollectionCard < ActiveRecord::Migration[5.1]
  def change
    add_column :collection_cards, :filter, :integer, default: 0
  end
end
