class AddFontPropertiesToCollectionCards < ActiveRecord::Migration[5.2]
  def change
    add_column :collection_cards, :font_color, :string
    add_column :collection_cards, :font_background, :boolean, default: false
  end
end
