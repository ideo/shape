class AddGuestGroupIdAndDomainsToOrganizations < ActiveRecord::Migration[5.1]
  def change
    add_column :organizations, :guest_group_id, :integer
    add_column :organizations, :domain_whitelist, :jsonb, default: []

    # also remove these unused fields
    remove_index :organizations, :handle
    remove_column :organizations, :handle, :string
  end
end
