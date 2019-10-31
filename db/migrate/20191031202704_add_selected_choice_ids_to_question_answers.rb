class AddSelectedChoiceIdsToQuestionAnswers < ActiveRecord::Migration[5.2]
  def change
    add_column :question_answers, :selected_choice_ids, :jsonb
  end
end
