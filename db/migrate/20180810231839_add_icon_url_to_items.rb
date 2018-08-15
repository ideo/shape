class AddIconUrlToItems < ActiveRecord::Migration[5.1]
  def change
    add_column :items, :icon_url, :string
    remove_column :items, :image, :string
  end
end
