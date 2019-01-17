class AddFilterToCollectionCard < ActiveRecord::Migration[5.1]
  def change
    add_column :collection_cards, :filter, :integer, default: CollectionCard.filters[:transparent_gray]
  end
end
