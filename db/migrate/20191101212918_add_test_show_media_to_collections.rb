class AddTestShowMediaToCollections < ActiveRecord::Migration[5.2]
  def change
    add_column :collections, :test_show_media, :boolean, default: true
  end
end
