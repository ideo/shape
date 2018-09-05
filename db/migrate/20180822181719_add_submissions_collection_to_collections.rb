class AddSubmissionsCollectionToCollections < ActiveRecord::Migration[5.1]
  def change
    add_reference :collections, :submission_box
  end
end
