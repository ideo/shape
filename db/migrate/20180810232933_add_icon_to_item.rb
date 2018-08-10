class AddIconToItem < ActiveRecord::Migration[5.1]
  def change
    add_column :items, :icon_url, :string
  end
end
