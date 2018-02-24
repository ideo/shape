class AddUrlToItems < ActiveRecord::Migration[5.1]
  def change
    add_column :items, :url, :string
  end
end
