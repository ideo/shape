class AddUnarchivedAtFields < ActiveRecord::Migration[5.1]
  def change
    add_column :collections, :unarchived_at, :datetime
    add_column :collection_cards, :unarchived_at, :datetime
    add_column :items, :unarchived_at, :datetime
  end
end
