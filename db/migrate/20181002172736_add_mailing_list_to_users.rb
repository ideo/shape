class AddMailingListToUsers < ActiveRecord::Migration[5.1]
  def change
    add_column :users, :mailing_list, :boolean, default: false
  end
end
