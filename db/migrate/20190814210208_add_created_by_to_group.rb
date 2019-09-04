class AddCreatedByToGroup < ActiveRecord::Migration[5.2]
  def change
    add_column :groups, :created_by_id, :integer
  end
end
