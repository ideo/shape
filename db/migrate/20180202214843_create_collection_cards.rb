class CreateCollectionCards < ActiveRecord::Migration[5.1]
  def change
    create_table :collection_cards do |t|
      t.integer :order, null: false
      t.integer :width, :height
      t.boolean :reference, default: false
      t.references :parent, :collection, :item
      t.timestamps
    end
  end
end
