class AddLocaleToUserAndOrganization < ActiveRecord::Migration[5.2]
  def change
    add_column :organizations, :default_locale, :string, default: 'en'
    add_column :users, :locale, :string
  end
end
