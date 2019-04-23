class AddLaunchedAtToCollection < ActiveRecord::Migration[5.1]
  def change
    add_column :collections, :test_launched_at, :datetime
  end
end
