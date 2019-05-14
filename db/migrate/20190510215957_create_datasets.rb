class CreateDatasets < ActiveRecord::Migration[5.1]
  def change
    create_table :datasets do |t|
      t.string :type, :measure
      t.integer :chart_type, :max_domain, :timeframe
      t.jsonb :cached_data
      t.string :question_type
      t.references :organization
      t.references :data_source, polymorphic: true
      t.timestamps
    end
  end
end
