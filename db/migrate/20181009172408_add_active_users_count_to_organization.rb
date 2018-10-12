class AddActiveUsersCountToOrganization < ActiveRecord::Migration[5.1]
  def change
    add_column :organizations, :active_users_count, :integer, null: false, default: 0
  end
end
