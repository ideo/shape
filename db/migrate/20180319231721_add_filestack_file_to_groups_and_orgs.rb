class AddFilestackFileToGroupsAndOrgs < ActiveRecord::Migration[5.1]
  def up
    remove_column :organizations, :pic_url_square

    Group.add_filestack_file_column!
    Organization.add_filestack_file_column!
  end

  def down
    add_column :organizations, :pic_url_square, :string

    Group.remove_filestack_file_column!
    Organization.remove_filestack_file_column!
  end
end
