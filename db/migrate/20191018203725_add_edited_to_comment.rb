class AddEditedToComment < ActiveRecord::Migration[5.2]
  def change
    add_column :comments, :edited, :boolean, default: false
  end
end
