class LegendSearchSourceDataItemsDatasetIndex < ActiveRecord::Migration[5.1]
  def change
    add_column :items, :legend_search_source, :integer
    add_index :data_items_datasets, [:data_item_id, :dataset_id], unique: true
  end
end
