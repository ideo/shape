class CreateGroups < ActiveRecord::Migration[5.1]
  def change
    create_table :groups do |t|
      t.string :name
      t.references :organization
      t.timestamps
    end

    add_column :organizations, :primary_group_id, :integer
  end
end
