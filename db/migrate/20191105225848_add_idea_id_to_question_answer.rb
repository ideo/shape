class AddIdeaIdToQuestionAnswer < ActiveRecord::Migration[5.2]
  def change
    add_reference :question_answers, :idea, index: false

    reversible do |change|
      change.up do
        # remove previous index that was unique on survey + question
        remove_index :question_answers, %i[survey_response_id question_id]
        add_index :question_answers, %i[survey_response_id]
        add_index :question_answers, %i[question_id survey_response_id],
                  unique: true,
                  name: 'index_question_answers_on_unique_response',
                  where: 'idea_id IS NULL'
        add_index :question_answers, %i[question_id idea_id survey_response_id],
                  unique: true,
                  name: 'index_question_answers_on_unique_idea_response',
                  where: 'idea_id IS NOT NULL'
      end

      change.down do
        add_index :question_answers, %i[survey_response_id question_id], unique: true
        remove_index :question_answers, %i[survey_response_id]
        remove_index :question_answers, name: 'index_question_answers_on_unique_response'
        remove_index :question_answers, name: 'index_question_answers_on_unique_idea_response'
      end
    end
  end
end
