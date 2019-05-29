class RenameNameToIdentifierForDataset < ActiveRecord::Migration[5.1]
  def change
    rename_column :datasets, :name, :identifier
  end
end
