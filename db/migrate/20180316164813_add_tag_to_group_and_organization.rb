class AddTagToGroupAndOrganization < ActiveRecord::Migration[5.1]
  def change
    add_column :groups, :tag, :string
    add_index :groups, :tag

    add_column :organizations, :tag, :string
    add_index :organizations, :tag
  end
end
