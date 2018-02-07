class CreateCollections < ActiveRecord::Migration[5.1]
  def change
    create_table :collections do |t|
      t.string :name, null: false
      t.references :organization, foreign_key: true
      t.references :cloned_from, references: :collections
      t.integer :collection_type, null: false, default: Collection.collection_types[:normal]

      t.timestamps
    end

    add_index :collections, [:organization_id, :collection_type]
  end
end
