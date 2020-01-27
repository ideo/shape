class AddStyleToCollections < ActiveRecord::Migration[5.2]
  def change
    add_column :collection_cards, :font_color, :string
  end
end
