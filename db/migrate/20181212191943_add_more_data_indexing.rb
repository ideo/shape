class AddMoreDataIndexing < ActiveRecord::Migration[5.1]
  def change
    add_index :collections, :created_at
    add_index :items, :created_at
  end
end
