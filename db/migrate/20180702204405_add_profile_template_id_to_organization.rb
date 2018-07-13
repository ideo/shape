class AddProfileTemplateIdToOrganization < ActiveRecord::Migration[5.1]
  def change
    add_column :organizations, :profile_template_id, :integer
  end
end
