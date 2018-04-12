class ChangeUsersEmailIndex < ActiveRecord::Migration[5.1]
  def up
    remove_index :users, :email
    remove_index :users, :provider
    remove_index :users, :uid
    add_index :users, :email # remove uniqueness constraint
    add_index :users, [:provider, :uid], unique: true
  end

  def down
    remove_index :users, :email
    remove_index :users, [:provider, :uid]
    add_index :users, :email, unique: true
    add_index :users, :provider
    add_index :users, :uid
  end
end
