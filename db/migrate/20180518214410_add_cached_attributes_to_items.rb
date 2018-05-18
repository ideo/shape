class AddCachedAttributesToItems < ActiveRecord::Migration[5.1]
  def change
    add_column :items, :cached_attributes, :jsonb
  end
end
