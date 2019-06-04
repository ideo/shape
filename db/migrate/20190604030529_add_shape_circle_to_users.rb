class AddShapeCircleToUsers < ActiveRecord::Migration[5.1]
  def change
    add_column :users, :shape_circle, :boolean, default: false
  end
end
