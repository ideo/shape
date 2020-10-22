class AddBackgroundColorToItems < ActiveRecord::Migration[5.2]
  def change
    add_column :items, :background_color, :string
    add_column :items, :background_color_opacity, :float, default: 1
  end
end
