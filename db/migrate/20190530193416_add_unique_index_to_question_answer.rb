class AddUniqueIndexToQuestionAnswer < ActiveRecord::Migration[5.1]
  def change
    remove_index :question_answers, :question_id
    remove_index :question_answers, :survey_response_id
    add_index :question_answers, [:survey_response_id, :question_id], unique: true
  end
end
