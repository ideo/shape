class AddLanguageDefaultToUserAndOrganization < ActiveRecord::Migration[5.2]
  def change
    add_column :organizations, :language_default, :string, default: 'en'
    add_column :users, :language, :string
  end
end
