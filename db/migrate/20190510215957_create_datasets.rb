class CreateDatasets < ActiveRecord::Migration[5.1]
  def change
    create_table :datasets do |t|
      t.string :type, :measure, :question_type, :url
      t.integer :chart_type, :max_domain, :timeframe, :total
      t.jsonb :cached_data, :style
      t.references :organization
      t.references :data_source, polymorphic: true
      t.timestamps
    end
  end
end
