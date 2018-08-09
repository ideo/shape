class AddShowMoveHelper < ActiveRecord::Migration[5.1]
  def change
    add_column :users, :show_move_helper, :boolean, default: true
  end
end
