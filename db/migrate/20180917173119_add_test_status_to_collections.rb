class AddTestStatusToCollections < ActiveRecord::Migration[5.1]
  def change
    add_column :collections, :test_status, :integer
    add_index :collections, :test_status
  end
end
