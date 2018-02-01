class CreateOrganizationUsers < ActiveRecord::Migration[5.1]
  def change
    create_table :organization_users do |t|
      t.references :organization, foreign_key: true
      t.references :user, foreign_key: true
      t.integer :role, null: false, default: OrganizationUser.roles[:member]

      t.timestamps
    end
  end
end
