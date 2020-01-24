class AddStyleToCollections < ActiveRecord::Migration[5.2]
  def change
    add_column :collections, :style, :jsonb, default: {}
  end
end
