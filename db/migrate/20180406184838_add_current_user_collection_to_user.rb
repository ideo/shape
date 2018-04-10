class AddCurrentUserCollectionToUser < ActiveRecord::Migration[5.1]
  def change
    add_column :users, :current_user_collection_id, :integer
  end
end
