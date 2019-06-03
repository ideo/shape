class CreateAudienceOrganizations < ActiveRecord::Migration[5.1]
  def change
    create_table :audience_organizations do |t|
      t.references :audience
      t.references :organization
      t.timestamps
    end
  end
end
