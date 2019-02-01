class CreateApiTokens < ActiveRecord::Migration[5.1]
  def change
    create_table :api_tokens do |t|
      t.text :token
      t.references :organization, index: false
      t.references :created_by, index: false
      t.timestamps
    end

    add_index :api_tokens, [:organization_id, :token]
  end
end
