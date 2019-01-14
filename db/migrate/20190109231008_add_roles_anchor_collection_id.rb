class AddRolesAnchorCollectionId < ActiveRecord::Migration[5.1]
  def change
    add_column :items, :roles_anchor_collection_id, :bigint
    add_column :collections, :roles_anchor_collection_id, :bigint

    add_index :items, :roles_anchor_collection_id
    add_index :collections, :roles_anchor_collection_id
  end
end
