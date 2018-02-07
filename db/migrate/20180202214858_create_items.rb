class CreateItems < ActiveRecord::Migration[5.1]
  def change
    create_table :items do |t|
      t.string :name
      t.string :type, :image
      t.text :content
      t.references :cloned_from, references: :items
      t.boolean :archived, default: false
      t.timestamps
    end
  end
end
