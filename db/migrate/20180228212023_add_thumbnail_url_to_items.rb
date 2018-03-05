class AddThumbnailUrlToItems < ActiveRecord::Migration[5.1]
  def change
    add_column :items, :thumbnail_url, :string
  end
end
