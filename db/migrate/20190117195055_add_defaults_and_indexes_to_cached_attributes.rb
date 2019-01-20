class AddDefaultsAndIndexesToCachedAttributes < ActiveRecord::Migration[5.1]
  def change
    change_column_default :collections, :cached_attributes, from: nil, to: {}
    change_column_default :items, :cached_attributes, from: nil, to: {}

    remove_index :roles, :resource_identifier
    add_index :roles, [:resource_identifier, :name], unique: true
  end
end
