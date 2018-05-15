 class CreateCommentThreads < ActiveRecord::Migration[5.1]
  def change
    create_table :comment_threads do |t|
      t.integer :record_id
      t.string :record_type

      t.timestamps
    end

    add_index :comment_threads, :record_id, unique: true
  end
end
