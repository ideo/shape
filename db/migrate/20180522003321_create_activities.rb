class CreateActivities < ActiveRecord::Migration[5.1]
  def change
    create_table :activities do |t|
      t.references :actor
      t.references :target, polymorphic: true
      t.integer :action

      t.timestamps
    end
  end
end
