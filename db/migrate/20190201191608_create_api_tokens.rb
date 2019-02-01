class CreateApiTokens < ActiveRecord::Migration[5.1]
  def change
    create_table :api_tokens do |t|
      t.text :token
      t.references :application_organization, :created_by,
                   index: false
      t.timestamps
    end

    add_index :api_tokens,
              [:application_organization_id, :token],
              name: 'index_api_tokens_on_app_org_id_and_token',
              unique: true
  end
end
