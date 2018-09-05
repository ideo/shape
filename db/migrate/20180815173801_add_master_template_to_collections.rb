class AddMasterTemplateToCollections < ActiveRecord::Migration[5.1]
  def change
    add_column :collections, :master_template, :boolean, default: false
  end
end
