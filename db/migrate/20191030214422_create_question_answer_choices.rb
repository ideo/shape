class CreateQuestionAnswerChoices < ActiveRecord::Migration[5.2]
  def change
    create_table :question_answer_choices do |t|
      t.integer :question_choice_id
      t.integer :question_answer_id

      t.timestamps
    end
  end
end
