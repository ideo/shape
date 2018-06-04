class CreateNotifications < ActiveRecord::Migration[5.1]
  def change
    create_table :notifications do |t|
      t.boolean :read, default: false
      t.references :activity
      t.references :user

      t.timestamps
    end
  end
end
