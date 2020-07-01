class AddIconToCollections < ActiveRecord::Migration[5.2]
  def change
    add_column :collections, :icon, :string
    add_column :collections, :show_icon_on_cover, :boolean
  end
end
