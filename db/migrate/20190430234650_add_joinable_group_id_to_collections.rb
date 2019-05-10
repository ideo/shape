class AddJoinableGroupIdToCollections < ActiveRecord::Migration[5.1]
  def change
    add_column :collections, :joinable_group_id, :bigint
  end
end
