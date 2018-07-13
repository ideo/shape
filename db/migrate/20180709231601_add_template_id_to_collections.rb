class AddTemplateIdToCollections < ActiveRecord::Migration[5.1]
  def change
    add_column :collections, :template_id, :integer, index: true
  end
end
