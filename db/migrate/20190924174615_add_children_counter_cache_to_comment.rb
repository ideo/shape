class AddChildrenCounterCacheToComment < ActiveRecord::Migration[5.2]
  def change
    add_column :comments, :replies_count, :integer, default: 0
  end
end
