class CreateAppMetrics < ActiveRecord::Migration[5.1]
  def change
    create_table :app_metrics do |t|
      t.column :metric, :string
      t.column :value, :float

      t.timestamps
    end
    add_index :app_metrics, %i[metric created_at]
  end
end
