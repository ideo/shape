class CreateTestAudiences < ActiveRecord::Migration[5.1]
  def change
    create_table :test_audiences do |t|
      t.integer :sample_size
      t.float :total_price
      t.references :audience, foreign_key: true

      t.timestamps
    end
  end
end
