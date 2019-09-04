class AddLanguageDefaultToUserAndOrganization < ActiveRecord::Migration[5.2]
  def change
    add_column :organizations, :language_default, :string
    add_column :users, :language_default, :string
  end
end
