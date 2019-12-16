class AddSearchTermToCollection < ActiveRecord::Migration[5.2]
  def change
    add_column :collections, :search_term, :string
  end
end
