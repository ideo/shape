class AddResourceIdentifierToRoles < ActiveRecord::Migration[5.1]
  def change
    add_column :roles, :resource_identifier, :string
    add_index :roles, :resource_identifier
  end
end
