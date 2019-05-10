class AddAnyoneCanViewToCollections < ActiveRecord::Migration[5.1]
  def change
    add_column :collections, :anyone_can_view, :boolean, default: false
  end
end
