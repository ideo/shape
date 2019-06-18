class AddIncentiveStatusToSurveyResponse < ActiveRecord::Migration[5.1]
  def change
    add_column :survey_responses, :incentive_status, :integer
    add_index :survey_responses, :incentive_status
  end
end
