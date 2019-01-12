class AddInAppBillingFlagToOrganization < ActiveRecord::Migration[5.1]
  def change
    add_column :organizations, :in_app_billing, :boolean, default: true, null: false
  end
end
