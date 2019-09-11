class CreateGroupHierarchies < ActiveRecord::Migration[5.2]
  def change
    create_table :group_hierarchies do |t|
      t.references :parent_group, references: :groups
      t.references :granted_by, references: :groups
      t.references :subgroup, references: :groups

      t.timestamps
    end
  end
end
