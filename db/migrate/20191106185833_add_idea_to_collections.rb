class AddIdeaToCollections < ActiveRecord::Migration[5.2]
  def change
    add_column :collections, :idea_id, :integer
    add_index :collections, :idea_id
  end
end
