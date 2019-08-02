class AddDefaultGroupToCollection < ActiveRecord::Migration[5.2]
  def change
    add_column :collections, :default_group_id, :integer
  end
end
