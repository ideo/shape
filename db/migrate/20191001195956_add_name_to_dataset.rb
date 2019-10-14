class AddNameToDataset < ActiveRecord::Migration[5.2]
  def change
    add_column :datasets, :name, :string
  end
end
