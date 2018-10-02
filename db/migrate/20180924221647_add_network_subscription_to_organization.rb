class AddNetworkSubscriptionToOrganization < ActiveRecord::Migration[5.1]
  def change
    add_column :organizations, :network_subscription_id, :string
  end
end
