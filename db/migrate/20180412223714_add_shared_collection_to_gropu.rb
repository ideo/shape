class AddSharedCollectionToGropu < ActiveRecord::Migration[5.1]
  def change
    add_column :groups, :current_shared_collection_id, :integer
  end
end
