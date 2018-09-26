class AddQuestionTypeToItems < ActiveRecord::Migration[5.1]
  def change
    add_column :items, :question_type, :integer
  end
end
