class CreateNetworkInvitations < ActiveRecord::Migration[5.2]
  def change
    create_table :network_invitations do |t|
      t.string :token
      t.bigint :user_id
      t.bigint :organization_id

      t.timestamps
    end

    add_index :network_invitations, :token
    add_index :network_invitations, %i[user_id organization_id]
  end
end
