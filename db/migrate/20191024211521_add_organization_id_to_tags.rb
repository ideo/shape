class AddOrganizationIdToTags < ActiveRecord::Migration[5.2]
  def change
    add_column :tags, :organization_ids, :jsonb, default: []
  end
end
