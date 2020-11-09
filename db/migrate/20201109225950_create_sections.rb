class CreateSections < ActiveRecord::Migration[5.2]
  def change
    create_table :sections do |t|
      t.string :name
      t.integer :row, :col, :width, :height
      t.references :parent
      t.timestamps
    end
  end
end
