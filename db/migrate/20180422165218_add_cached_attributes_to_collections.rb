class AddCachedAttributesToCollections < ActiveRecord::Migration[5.1]
  def change
    add_column :collections, :cached_attributes, :jsonb
  end
end
