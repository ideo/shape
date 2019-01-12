class AddTrailExpiredEmailSentToOrganization < ActiveRecord::Migration[5.1]
  def change
    add_column :organizations, :trial_expired_email_sent, :boolean, default: false, null: false
  end
end
