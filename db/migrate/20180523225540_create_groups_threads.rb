class CreateGroupsThreads < ActiveRecord::Migration[5.1]
  def change
    create_table :groups_threads do |t|
      t.references :group, index: false
      t.references :comment_thread, index: false
      t.datetime :created_at, null: false
    end

    add_index :groups_threads, [:group_id, :comment_thread_id], unique: true, name: 'by_groups_comment_thread'
  end
end
