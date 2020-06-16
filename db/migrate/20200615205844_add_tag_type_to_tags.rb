class AddTagTypeToTags < ActiveRecord::Migration[5.2]
  def change
    add_column :tags, :tag_type, :integer, default: 0
    add_column :tags, :user_id, :bigint, null: true
  end
end
