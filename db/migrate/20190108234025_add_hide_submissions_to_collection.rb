class AddHideSubmissionsToCollection < ActiveRecord::Migration[5.1]
  def change
    add_column :collections, :hide_submissions, :boolean, default: false
  end
end
