class AddArchiveBatchIndex < ActiveRecord::Migration[5.2]
  def change
    add_index :items, :archive_batch
    add_index :collections, :archive_batch
    add_index :collection_cards, :archive_batch
    add_index :groups, :archive_batch
  end
end
