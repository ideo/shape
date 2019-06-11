class AddDefaultToAudiences < ActiveRecord::Migration[5.1]
  def up
    add_column :audiences, :global_default, :integer, null: true
    add_index :audiences, :global_default

    # if you already seeded audiences
    Audience.find_by(name: 'Share via Link')&.update(global_default: 1)
    Audience.find_by(name: 'All People (No Filters)')&.update(global_default: 2)
  end

  def down
    remove_index :audiences, :global_default
    remove_column :audiences, :global_default
  end
end
