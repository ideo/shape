class ChangePricePerResponseToMinPrice < ActiveRecord::Migration[5.2]
  def change
    rename_column :audiences, :price_per_response, :min_price_per_response
  end
end
