class AddDefaultsAndIndexesToCachedAttributes < ActiveRecord::Migration[5.1]
  def change
    change_column_default :collections, :cached_attributes, {}
    change_column_default :items, :cached_attributes, {}

    add_index :collections, :cached_attributes, using: :gin
    add_index :items, :cached_attributes, using: :gin
  end
end
