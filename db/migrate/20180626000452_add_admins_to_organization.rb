class AddAdminsToOrganization < ActiveRecord::Migration[5.1]
  def change
    add_column :organizations, :admin_group_id, :integer
  end
end
