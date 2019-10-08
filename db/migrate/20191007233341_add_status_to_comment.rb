class AddStatusToComment < ActiveRecord::Migration[5.2]
  def change
    add_column :comments, :status, :integer, default: 0
  end
end
