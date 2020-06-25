class AddCustomIconToCollections < ActiveRecord::Migration[5.2]
  def change
    add_column :collections, :custom_icon, :string
    add_column :collections, :show_icon_on_cover, :boolean
  end
end
