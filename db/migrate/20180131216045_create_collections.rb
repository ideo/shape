class CreateCollections < ActiveRecord::Migration[5.1]
  def change
    create_table :collections do |t|
      t.string :name, null: false
      t.references :organization, foreign_key: true
      t.references :cloned_from, references: :collections
      t.integer :type, null: false, default: Collection.types[:normal]

      t.timestamps
    end

    add_index :collections, [:organization_id, :type]
  end
end
