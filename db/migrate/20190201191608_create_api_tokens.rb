class CreateApiTokens < ActiveRecord::Migration[5.1]
  def change
    create_table :api_tokens do |t|
      t.text :token, index: true
      t.references :application, :organization, :created_by,
                   index: false
      t.timestamps
    end

    add_index :api_tokens,
              [:application_id, :organization_id],
              name: 'index_api_tokens_on_app_id_org_id'
  end
end
