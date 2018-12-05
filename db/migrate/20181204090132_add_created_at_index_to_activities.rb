class AddCreatedAtIndexToActivities < ActiveRecord::Migration[5.1]
  def change
    add_index :activities, :created_at
  end
end
