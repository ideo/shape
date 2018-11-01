class AddGettingStartedIdToCollection < ActiveRecord::Migration[5.1]
  def change
    add_column :organizations, :getting_started_collection_id, :integer
  end
end
