class AddCachedAttributesToUsers < ActiveRecord::Migration[5.1]
  def change
    add_column :users, :cached_attributes, :jsonb
  end
end
