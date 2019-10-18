class AddApplicationToGroups < ActiveRecord::Migration[5.2]
  def change
    add_column :groups, :application_id, :integer
    add_column :applications, :group_icon_url, :string
  end
end
