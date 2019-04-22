class AddCoverTypeToCollections < ActiveRecord::Migration[5.1]
  def change
    add_column :collections, :cover_type, :integer, default: 0
  end
end
