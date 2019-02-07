class CreateApplicationOrganizations < ActiveRecord::Migration[5.1]
  def change
    create_table :application_organizations do |t|
      t.references :application, :organization, :root_collection,
                   index: false
      t.timestamps
    end

    add_index :application_organizations,
              [:application_id, :organization_id],
              name: 'index_app_org_on_app_id_org_id',
              unique: true
  end
end
