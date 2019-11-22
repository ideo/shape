class AddIncentivePaidToSurveyResponse < ActiveRecord::Migration[5.2]
  def change
    add_column :survey_responses, :incentive_paid_amount, :decimal, precision: 10, scale: 2
  end
end
