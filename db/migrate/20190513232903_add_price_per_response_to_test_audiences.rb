class AddPricePerResponseToTestAudiences < ActiveRecord::Migration[5.1]
  def change
    add_column :test_audiences, :price_per_response, :decimal, precision: 10, scale: 2
  end
end