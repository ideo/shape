class AddParentSnapshotToCollectionCards < ActiveRecord::Migration[5.2]
  def change
    add_column :collection_cards, :parent_snapshot, :jsonb
  end
end
