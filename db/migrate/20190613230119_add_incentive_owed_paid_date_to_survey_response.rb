class AddIncentiveOwedPaidDateToSurveyResponse < ActiveRecord::Migration[5.1]
  def change
    add_column :survey_responses, :incentive_owed_at, :datetime
    add_column :survey_responses, :incentive_paid_at, :datetime
  end
end
