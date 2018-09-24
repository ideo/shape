class CreateQuestionAnswers < ActiveRecord::Migration[5.1]
  def change
    create_table :question_answers do |t|
      t.references :survey_response, index: true
      t.references :question, index: true
      t.text :answer_text
      t.integer :answer_number

      t.timestamps
    end
  end
end
