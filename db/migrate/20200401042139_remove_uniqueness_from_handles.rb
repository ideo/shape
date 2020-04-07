class RemoveUniquenessFromHandles < ActiveRecord::Migration[5.2]
  # removing this because handles come from INA username, and INA enforces its own uniqueness
  def up
    remove_index :users, :handle
    add_index :users, :handle
  end
  def down
    remove_index :users, :handle
    add_index :users, :handle, unique: true
  end
end
