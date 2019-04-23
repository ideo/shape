class AddSubmissionsEnabledToCollection < ActiveRecord::Migration[5.1]
  def change
    add_column :collections, :submissions_enabled, :boolean, default: true
  end
end
