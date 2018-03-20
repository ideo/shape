class AddFilestackFileToGroupsAndOrgs < ActiveRecord::Migration[5.1]
  def up
    Group.add_filestack_file_column!
    Organization.add_filestack_file_column!
  end

  def down
    Group.remove_filestack_file_column!
    Organization.remove_filestack_file_column!
  end
end
