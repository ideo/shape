class AddDeactivatedFlagToOrganization < ActiveRecord::Migration[5.1]
  def change
    add_column :organizations, :deactivated, :boolean, default: false, null: false
  end
end
