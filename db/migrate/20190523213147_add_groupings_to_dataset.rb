class AddGroupingsToDataset < ActiveRecord::Migration[5.1]
  def change
    add_column :datasets, :groupings, :jsonb, default: []
  end
end
