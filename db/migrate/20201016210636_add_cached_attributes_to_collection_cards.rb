class AddCachedAttributesToCollectionCards < ActiveRecord::Migration[5.2]
  def change
     add_column :collection_cards, :cached_attributes, :jsonb, default: {}
  end
end
