class AddParentToComment < ActiveRecord::Migration[5.2]
  def change
    add_reference :comments, :parent
  end
end
