class AddStatusToSurveyResponses < ActiveRecord::Migration[5.1]
  def change
    add_column :survey_responses, :status, :integer, default: 0
  end
end
