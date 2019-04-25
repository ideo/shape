class AddViewableByAnyoneToCollections < ActiveRecord::Migration[5.1]
  def change
    add_column :collections, :viewable_by_anyone, :boolean, default: false
  end
end
