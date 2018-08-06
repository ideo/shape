class AddLastNotificationSentToUsers < ActiveRecord::Migration[5.1]
  def change
    add_column :users, :last_notification_mail_sent, :datetime
  end
end
