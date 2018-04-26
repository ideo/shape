class AddGuestGroupIdToOrganizations < ActiveRecord::Migration[5.1]
  def change
    add_column :organizations, :guest_group_id, :integer
    remove_index :organizations, :handle
    remove_column :organizations, :handle, :string
  end
end
