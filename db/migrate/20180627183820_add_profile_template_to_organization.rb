class AddProfileTemplateToOrganization < ActiveRecord::Migration[5.1]
  def change
    add_column :organizations, :template_collection_id, :integer
  end
end
