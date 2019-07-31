class AddTermsVersionToOrganizations < ActiveRecord::Migration[5.2]
  def change
    add_column :organizations, :terms_version, :integer
  end
end
