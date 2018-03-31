class AddInvitationTokenToUsers < ActiveRecord::Migration[5.1]
  def change
    add_column :users, :invitation_token, :string
    add_index :users, :invitation_token
  end
end
