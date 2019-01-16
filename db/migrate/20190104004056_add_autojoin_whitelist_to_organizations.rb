class AddAutojoinWhitelistToOrganizations < ActiveRecord::Migration[5.1]
  def change
    add_column :organizations, :autojoin_domains, :jsonb, default: []
    add_index :organizations, :autojoin_domains, using: :gin
  end
end
