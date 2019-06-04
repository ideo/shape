class AddShapeCircleToUsers < ActiveRecord::Migration[5.1]
  def change
    add_column :users, :shape_circle_member, :boolean, default: false
  end
end
