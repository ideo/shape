class AddTrialUserCountToOrganization < ActiveRecord::Migration[5.1]
  def change
    add_column :organizations, :trial_user_count, :integer, null: false, default: 0
  end
end
