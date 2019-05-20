class AddTestClosedAtToCollection < ActiveRecord::Migration[5.1]
  def change
    add_column :collections, :test_closed_at, :datetime
  end
end
