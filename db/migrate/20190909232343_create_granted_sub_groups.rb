class CreateGrantedSubGroups < ActiveRecord::Migration[5.2]
  def change
    create_table :granted_sub_groups do |t|
      t.integer :group_id
      t.integer :granted_by
      t.integer :subgroup_id
    end
  end
end
