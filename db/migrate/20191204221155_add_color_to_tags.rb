class AddColorToTags < ActiveRecord::Migration[5.2]
  def change
    add_column :tags, :color, :string
  end
end
