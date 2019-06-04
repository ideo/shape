class AddTypeToGroups < ActiveRecord::Migration[5.1]
  def change
    add_column :groups, :type, :string
    add_index :groups, :type
  end
end
