class AddHandleToGroupAndOrganization < ActiveRecord::Migration[5.1]
  def change
    add_column :groups, :handle, :string
    add_index :groups, :handle

    add_column :organizations, :handle, :string
    add_index :organizations, :handle
  end
end
