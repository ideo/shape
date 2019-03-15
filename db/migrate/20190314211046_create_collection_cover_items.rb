class CreateCollectionCoverItems < ActiveRecord::Migration[5.1]
  def change
    create_table :collection_cover_items do |t|
      t.references :collection, :item, index: false
      t.integer :order
      t.timestamps
    end

    add_index :collection_cover_items,
              %i[collection_id item_id],
              unique: true
  end
end
