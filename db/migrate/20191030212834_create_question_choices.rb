class CreateQuestionChoices < ActiveRecord::Migration[5.2]
  def change
    create_table :question_choices do |t|
      t.text :text
      t.integer :order
      t.integer :value
      t.boolean :archived

      t.integer :question_item_id

      t.timestamps
    end
  end
end
