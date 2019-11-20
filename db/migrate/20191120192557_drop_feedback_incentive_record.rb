class DropFeedbackIncentiveRecord < ActiveRecord::Migration[5.2]
  def up
    drop_table :feedback_incentive_records
  end

  def down
    # Not really reversible - we don't need the data
    create_table :feedback_incentive_records
  end
end
