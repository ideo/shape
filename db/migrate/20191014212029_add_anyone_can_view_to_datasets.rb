class AddAnyoneCanViewToDatasets < ActiveRecord::Migration[5.2]
  def change
    add_column :datasets, :anyone_can_view, :boolean, default: true
    add_index :datasets, :anyone_can_view
  end
end
