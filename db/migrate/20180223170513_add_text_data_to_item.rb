class AddTextDataToItem < ActiveRecord::Migration[5.1]
  def change
    add_column :items, :text_data, :jsonb
  end
end
