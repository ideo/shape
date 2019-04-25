class AddShouldRecontactToUsers < ActiveRecord::Migration[5.1]
  def change
    add_column :users, :should_recontact, :boolean, default: false
  end
end
