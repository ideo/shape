class AddShowHelperToUsers < ActiveRecord::Migration[5.1]
  def change
    add_column :users, :show_helper, :boolean, default: true
  end
end
