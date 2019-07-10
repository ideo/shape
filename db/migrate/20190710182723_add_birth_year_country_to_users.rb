class AddBirthYearCountryToUsers < ActiveRecord::Migration[5.2]
  def change
    add_column :users, :birth_year, :integer, limit: 2
    add_column :users, :country, :string
  end
end
