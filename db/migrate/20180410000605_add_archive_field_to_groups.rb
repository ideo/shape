class AddArchiveFieldToGroups < ActiveRecord::Migration[5.1]
  def up
    Group.add_archived_column!
  end

  def down
    Group.try(:remove_archived_column!)
  end
end
