class AddApplicationToDataset < ActiveRecord::Migration[5.2]
  def change
    add_column :datasets, :application_id, :integer
  end
end
