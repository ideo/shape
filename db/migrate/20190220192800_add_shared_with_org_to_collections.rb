class AddSharedWithOrgToCollections < ActiveRecord::Migration[5.1]
  def change
    add_column :collections, :shared_with_organization, :boolean, default: false
  end
end
