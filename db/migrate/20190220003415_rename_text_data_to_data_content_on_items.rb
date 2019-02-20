class RenameTextDataToDataContentOnItems < ActiveRecord::Migration[5.1]
  def change
    rename_column :items, :text_data, :data_content
  end
end
