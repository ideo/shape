class UserCollectionFilter < ActiveRecord::Migration[5.2]
  def change
    create_table :user_collection_filters do |t|
      t.boolean :selected, default: true
      t.references :collection_filter
      t.references :user
      t.timestamps
    end
  end
end
