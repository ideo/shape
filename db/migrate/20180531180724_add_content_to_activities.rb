class AddContentToActivities < ActiveRecord::Migration[5.1]
  def change
    add_column :activities, :content, :text
  end
end
