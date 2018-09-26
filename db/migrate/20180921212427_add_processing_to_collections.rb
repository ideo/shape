class AddProcessingToCollections < ActiveRecord::Migration[5.1]
  def change
    add_column :collections, :processing, :boolean, default: false
    add_column :collections, :processing_message, :string
  end
end
