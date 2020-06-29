class CreateUserTags < ActiveRecord::Migration[5.2]
  def change
    create_table :user_tags do |t|
      t.references :user, index: false
      t.references :record, polymorphic: true, index: false
      t.timestamps
    end

    add_index :user_tags, %i[user_id record_id record_type], unique: true
  end
end
