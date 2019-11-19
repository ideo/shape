class AddSurveyResponsesIdToTestResultsCollection < ActiveRecord::Migration[5.2]
  def change
    add_column :collections, :survey_response_id, :integer
  end
end
