class ChangePricePerResponseForAudiences < ActiveRecord::Migration[5.1]
  def up
    remove_column :audiences, :price_per_response
    add_column :audiences, :price_per_response, :decimal, precision: 10, scale: 2
  end

  def down
    remove_column :audiences, :price_per_response
    add_column :audiences, :price_per_response, :float
  end
end
