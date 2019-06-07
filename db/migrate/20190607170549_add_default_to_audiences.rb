class AddDefaultToAudiences < ActiveRecord::Migration[5.1]
  def change
    add_column :audiences, :global_default, :integer, null: true
    add_index :audiences, :global_default
  end
end
