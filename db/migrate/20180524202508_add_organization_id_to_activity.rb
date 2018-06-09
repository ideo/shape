class AddOrganizationIdToActivity < ActiveRecord::Migration[5.1]
  def change
    add_column :activities, :organization_id, :bigint
    add_index :activities, :organization_id
  end
end
