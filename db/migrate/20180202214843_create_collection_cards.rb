class CreateCollectionCards < ActiveRecord::Migration[5.1]
  def change
    create_table :collection_cards do |t|
      t.integer :order, null: false
      t.integer :width, :height
      t.boolean :reference, default: false
      t.references :collection, foreign_key: true
      t.references :linkable, polymorphic: true
      t.timestamps
    end
  end
end
