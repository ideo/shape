class CreateUsersThreads < ActiveRecord::Migration[5.1]
  def change
    create_table :users_threads do |t|
      t.references :user, index: false
      t.references :comment_thread, index: false
      t.datetime :last_viewed_at
      t.datetime :created_at, null: false
    end

    add_index :users_threads, [:user_id, :comment_thread_id], unique: true, name: 'by_users_comment_thread'

    add_column :comment_threads, :organization_id, :bigint
    add_index :comment_threads, :organization_id
  end
end
