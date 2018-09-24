class AddSessionUidToSurveyResponses < ActiveRecord::Migration[5.1]
  def change
    add_column :survey_responses, :session_uid, :text
    add_index :survey_responses, :session_uid, unique: true
  end
end
