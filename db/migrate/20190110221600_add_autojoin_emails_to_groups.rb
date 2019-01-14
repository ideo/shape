class AddAutojoinEmailsToGroups < ActiveRecord::Migration[5.1]
  def change
    add_column :groups, :autojoin_emails, :jsonb, default: []
    add_index :groups, :autojoin_emails, using: :gin
  end
end
