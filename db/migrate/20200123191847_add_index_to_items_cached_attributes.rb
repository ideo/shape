class AddIndexToItemsCachedAttributes < ActiveRecord::Migration[5.2]
  def up
    add_index :items, "(cached_attributes->>'pending_transcoding_uuid')", name: 'index_items_on_transcoding_uuid'
  end
  def down
    remove_index :items, name: 'index_items_on_transcoding_uuid'
  end
end
