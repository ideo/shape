class AddLastBroadcastAtToItems < ActiveRecord::Migration[5.2]
  def change
    add_column :items, :last_broadcast_at, :datetime
  end
end
