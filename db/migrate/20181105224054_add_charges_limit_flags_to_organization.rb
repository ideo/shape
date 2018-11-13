class AddChargesLimitFlagsToOrganization < ActiveRecord::Migration[5.1]
  def change
    add_column :organizations, :sent_high_charges_low_email, :boolean, default: false, null: false
    add_column :organizations, :sent_high_charges_middle_email, :boolean, default: false, null: false
    add_column :organizations, :sent_high_charges_high_email, :boolean, default: false, null: false
  end
end
