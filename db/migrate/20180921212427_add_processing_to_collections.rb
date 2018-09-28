class AddProcessingToCollections < ActiveRecord::Migration[5.1]
  def change
    add_column :collections, :processing_status, :integer
  end
end
