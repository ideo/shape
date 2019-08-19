class ChangeLastActiveAtToJsonb < ActiveRecord::Migration[5.2]
  def up
    remove_column :users, :last_active_at
    add_column :users, :last_active_at, :jsonb, default: {}
  end

  def down
    remove_column :users, :last_active_at
    add_column :users, :last_active_at, :datetime
  end
end
