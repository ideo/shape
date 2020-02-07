class AddNumColumnsToCollections < ActiveRecord::Migration[5.2]
  def change
    add_column :collections, :num_columns, :integer
  end
end
