class AddTiersToDataset < ActiveRecord::Migration[5.2]
  def change
    add_column :datasets, :tiers, :jsonb, default: []
  end
end
