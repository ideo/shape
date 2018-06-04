class AddHandleToUsers < ActiveRecord::Migration[5.1]
  def change
    add_column :users, :handle, :string
    add_index :users, :handle, unique: true
  end
end
