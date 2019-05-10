class AddAnyoneCanJoinToCollections < ActiveRecord::Migration[5.1]
  def change
    add_column :collections, :anyone_can_join, :boolean, default: false
  end
end
