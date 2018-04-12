class AddCreatedByToCollection < ActiveRecord::Migration[5.1]
  def change
    add_column :collections, :created_by_id, :integer
  end
end
