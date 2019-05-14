class CreateDataItemsDatasets < ActiveRecord::Migration[5.1]
  def change
    create_table :data_items_datasets do |t|
      t.references :data_item, :dataset, index: false
      t.integer :order, null: false
      t.timestamps
    end

    add_index :data_items_datasets,
              [:data_item_id, :dataset_id, :order],
              name: 'data_items_datasets_aggregate_index'
  end
end
