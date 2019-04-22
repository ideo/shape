class AddLegendItemIdToDataItem < ActiveRecord::Migration[5.1]
  def change
    add_column :items, :legend_item_id, :integer
  end
end
