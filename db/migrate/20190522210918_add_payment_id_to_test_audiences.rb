class AddPaymentIdToTestAudiences < ActiveRecord::Migration[5.1]
  def change
    add_column :test_audiences, :network_payment_id, :string
    add_column :test_audiences, :launched_by_id, :integer
  end
end
