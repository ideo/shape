class AddTemplateHelperSettingsToUser < ActiveRecord::Migration[5.2]
  def change
    add_column :users, :user_settings_data, :jsonb, default: {}, null: false
  end
end
