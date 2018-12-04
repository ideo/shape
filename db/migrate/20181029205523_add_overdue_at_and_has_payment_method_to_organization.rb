class AddOverdueAtAndHasPaymentMethodToOrganization < ActiveRecord::Migration[5.1]
  def change
    add_column :organizations, :overdue_at, :timestamp
    add_column :organizations, :has_payment_method, :boolean, default: false, null: false
  end
end
