class AddSubgroupsToGroup < ActiveRecord::Migration[5.2]
  def change
    add_column :groups, :subgroup_ids, :jsonb, default: []
    add_index :groups, :subgroup_ids, using: :gin
  end
end
