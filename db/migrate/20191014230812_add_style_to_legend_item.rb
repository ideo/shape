class AddStyleToLegendItem < ActiveRecord::Migration[5.2]
  def change
    add_column :items, :style, :jsonb
  end
end
