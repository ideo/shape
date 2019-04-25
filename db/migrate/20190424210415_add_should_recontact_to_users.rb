class AddShouldRecontactToUsers < ActiveRecord::Migration[5.1]
  def change
    add_column :users, :feedback_contact_preference, :integer, default: 0
  end
end
