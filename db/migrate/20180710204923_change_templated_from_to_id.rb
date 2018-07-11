class ChangeTemplatedFromToId < ActiveRecord::Migration[5.1]
  def change
    rename_column :collection_cards, :templated_from, :templated_from_id
    add_index :collection_cards, :templated_from_id
  end
end
