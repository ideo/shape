class AddDefaultValueToAudiencesPricePerResponse < ActiveRecord::Migration[5.1]
  def up
    change_column :audiences, :price_per_response, :decimal, precision: 10, scale: 2, default: 0
  end
  def down
    change_column :audiences, :price_per_response, :decimal, precision: 10, scale: 2, default: nil
  end
end
