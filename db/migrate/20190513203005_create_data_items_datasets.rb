class CreateDataItemsDatasets < ActiveRecord::Migration[5.1]
  def change
    create_table :data_items_datasets do |t|
      t.references :data_item, :dataset, index: false
      t.integer :order, null: false
      t.boolean :selected, default: true
      t.timestamps
    end

    add_index :data_items_datasets,
              [:data_item_id, :dataset_id, :order, :selected],
              name: 'data_items_datasets_aggregate_index'
  end
end
