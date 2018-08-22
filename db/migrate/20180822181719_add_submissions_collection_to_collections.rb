class AddSubmissionsCollectionToCollections < ActiveRecord::Migration[5.1]
  def change
    add_reference :collections, :submissions_collection
  end
end
