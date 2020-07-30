class AddCollectionStyleSettings < ActiveRecord::Migration[5.2]
  def change
    add_column :collections, :font_color, :string, default: nil
    add_column :collections, :propagate_font_color, :boolean, default: false
    add_column :collections, :propagate_background_image, :boolean, default: false
  end
end
