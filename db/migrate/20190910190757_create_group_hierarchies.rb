class CreateGroupHierarchies < ActiveRecord::Migration[5.2]
  def change
    create_table :group_hierarchies do |t|
      t.references :parent_group, references: :groups
      t.jsonb :path, null: false, default: '{}'
      t.references :subgroup, references: :groups

      t.timestamps
    end

    add_index :group_hierarchies, :path, using: :gin
  end
end
