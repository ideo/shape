class AddCachedTestScoresToCollections < ActiveRecord::Migration[5.1]
  def change
    add_column :collections, :cached_test_scores, :jsonb
    add_index :collections, :cached_test_scores, using: :gin
  end
end
