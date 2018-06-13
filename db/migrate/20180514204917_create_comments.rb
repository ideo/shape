class CreateComments < ActiveRecord::Migration[5.1]
  def change
    create_table :comments do |t|
      t.integer :comment_thread_id
      t.integer :author_id
      t.text :message

      t.timestamps
    end

    add_index :comments, :comment_thread_id
  end
end
