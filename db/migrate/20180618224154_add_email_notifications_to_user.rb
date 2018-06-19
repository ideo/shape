class AddEmailNotificationsToUser < ActiveRecord::Migration[5.1]
  def change
    add_column :users, :notify_through_email, :boolean, default: true
  end
end
