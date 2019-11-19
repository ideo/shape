class AddQuestionTypeIndexToItems < ActiveRecord::Migration[5.2]
  def change
    add_index :items, :question_type
  end
end
