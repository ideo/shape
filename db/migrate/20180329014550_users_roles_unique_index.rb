class UsersRolesUniqueIndex < ActiveRecord::Migration[5.1]
  def up
    remove_index :users_roles, [:user_id, :role_id]
    add_index :users_roles, [:user_id, :role_id], unique: true
  end

  def down
    remove_index :users_roles, [:user_id, :role_id], unique: true
    add_index :users_roles, [:user_id, :role_id]
  end
end
