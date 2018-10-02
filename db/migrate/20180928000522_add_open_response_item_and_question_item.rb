class AddOpenResponseItemAndQuestionItem < ActiveRecord::Migration[5.1]
  def change
    add_column :question_answers, :open_response_item_id, :integer
    add_column :collections, :question_item_id, :integer
  end
end
