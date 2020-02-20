class AddActivitiesIndexOnActionOrgDate < ActiveRecord::Migration[5.2]
  def change
    # these two indices needed to be combined to be effective
    remove_index :activities, column: %i[action target_type organization_id], name: 'index_activities_action_target_org'
    remove_index :activities, :created_at
    # create combo index including target_id
    add_index :activities, %i[action organization_id created_at target_type], name: 'activities_action_date'
    add_index :activities, %i[action organization_id target_type target_id], name: 'activities_action_target'
  end
end
