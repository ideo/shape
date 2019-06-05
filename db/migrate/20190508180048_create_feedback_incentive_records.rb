class CreateFeedbackIncentiveRecords < ActiveRecord::Migration[5.1]
  def change
    create_table :feedback_incentive_records do |t|
      t.belongs_to :user, foreign_key: true
      t.belongs_to :survey_response, foreign_key: true
      t.decimal :amount, precision: 10, scale: 2
      t.decimal :current_balance, precision: 10, scale: 2

      t.timestamps
    end
  end
end
