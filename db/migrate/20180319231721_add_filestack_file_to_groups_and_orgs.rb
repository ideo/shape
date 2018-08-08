class AddFilestackFileToGroupsAndOrgs < ActiveRecord::Migration[5.1]
  def up
    remove_column :organizations, :pic_url_square

    add_column :groups, :filestack_file_id, :integer
    add_column :organizations, :filestack_file_id, :integer
  end

  def down
    add_column :organizations, :pic_url_square, :string

    remove_column :groups, :filestack_file_id
    remove_column :organizations, :filestack_file_id
  end
end
