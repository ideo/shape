class AddPinnedTemplatedToCollectionCards < ActiveRecord::Migration[5.1]
  def change
    add_column :collection_cards, :pinned, :boolean, default: false
    add_column :collection_cards, :templated_from, :integer
  end
end
