class AddSubscribedToUsersThread < ActiveRecord::Migration[5.1]
  def change
    add_column :users_threads, :subscribed, :boolean, default: true
  end
end
