class CreateCollections < ActiveRecord::Migration[5.1]
  def change
    create_table :collections do |t|
      t.string :name
      t.integer :organization_id
      t.integer :cloned_from_id
      t.integer :type

      t.timestamps
    end

    add_index :collections, [:organization_id, :type]
    add_index :collections, :cloned_from_id
  end
end
