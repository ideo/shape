class AddTrailUsersCountExceededEmailSentToOrganization < ActiveRecord::Migration[5.1]
  def change
    add_column :organizations, :trail_users_count_exceeded_email_sent, :boolean, default: false, null: false
  end
end
