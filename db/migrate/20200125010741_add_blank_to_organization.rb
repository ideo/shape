class AddBlankToOrganization < ActiveRecord::Migration[5.2]
  def change
    add_column :organizations, :shell, :boolean, default: false
  end
end
