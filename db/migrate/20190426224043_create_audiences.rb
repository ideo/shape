class CreateAudiences < ActiveRecord::Migration[5.1]
  def change
    create_table :audiences do |t|
      t.string :name
      t.float :price_per_response
      t.string :criteria
      t.references :organization

      t.timestamps
    end
  end
end
