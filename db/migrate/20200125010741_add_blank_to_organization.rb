class AddBlankToOrganization < ActiveRecord::Migration[5.2]
  def change
    add_column :organizations, :blank, :boolean, default: false
  end
end
