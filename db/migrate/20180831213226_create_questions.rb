class CreateQuestions < ActiveRecord::Migration[5.1]
  def change
    create_table :questions do |t|
      t.references :test_collection, index: true
      t.integer :question_type
      t.integer :order

      t.timestamps
    end
  end
end
