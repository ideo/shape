class CreateDatasets < ActiveRecord::Migration[5.1]
  def change
    create_table :datasets do |t|
      t.jsonb :data
      t.references :organization
      t.references :data_source, polymorphic: true
      t.boolean :global, default: false
      t.timestamps
    end
  end
end
