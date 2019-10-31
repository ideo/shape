class CreateCollectionFilters < ActiveRecord::Migration[5.2]
  def change
    create_table :collection_filters do |t|
      t.integer :filter_type
      t.string :text
      t.references :collection
      t.timestamps
    end
  end
end
