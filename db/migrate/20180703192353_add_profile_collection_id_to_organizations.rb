class AddProfileCollectionIdToOrganizations < ActiveRecord::Migration[5.1]
  def change
    add_column :organizations, :profile_collection_id, :integer
  end
end
