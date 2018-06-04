class AddCombinedActivitiesToNotifications < ActiveRecord::Migration[5.1]
  def change
    add_column :notifications, :combined_activities_ids, :integer, array: true, default: []
  end
end
