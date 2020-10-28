class AddCachedAttributesToOrganizations < ActiveRecord::Migration[5.2]
  def change
    add_column :organizations, :cached_attributes, :jsonb, default: {}
  end
end
