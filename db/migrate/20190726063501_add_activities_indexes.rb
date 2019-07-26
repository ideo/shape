class AddActivitiesIndexes < ActiveRecord::Migration[5.2]
  def change
    add_index :activities, %i[action target_type organization_id], name: 'index_activities_action_target_org'
  end
end
