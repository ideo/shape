class AddColorAndApplicationToTags < ActiveRecord::Migration[5.2]
  def change
    add_column :tags, :color, :string
    add_column :tags, :application_id, :integer
  end
end
