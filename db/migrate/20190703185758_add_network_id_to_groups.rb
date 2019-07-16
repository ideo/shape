class AddNetworkIdToGroups < ActiveRecord::Migration[5.2]
  def change
    add_column :groups, :network_id, :string
    add_index :groups, :network_id
  end
end
