class AddTestCollectionIdToCollections < ActiveRecord::Migration[5.1]
  def change
    add_column :collections, :test_collection_id, :bigint, index: true
  end
end
