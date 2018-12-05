class AddDataSettingsToItems < ActiveRecord::Migration[5.1]
  def change
    add_column :items, :data_settings, :jsonb
  end
end
