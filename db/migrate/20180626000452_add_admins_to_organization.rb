class AddAdminsToOrganization < ActiveRecord::Migration[5.1]
  def change
    add_column :organizations, :amdin_group_id, :integer
  end
end
