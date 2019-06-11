class CreatePayments < ActiveRecord::Migration[5.1]
  def change
    create_table :payments do |t|
      t.text :description
      t.decimal :amount, :unit_amount, precision: 10, scale: 2
      t.integer :quantity, :network_payment_id, :network_payment_method_id
      t.references :user, :organization
      t.references :purchasable, polymorphic: true
      t.timestamps
    end
  end
end
