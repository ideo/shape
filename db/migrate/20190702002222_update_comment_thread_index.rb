class UpdateCommentThreadIndex < ActiveRecord::Migration[5.2]
  def change
    remove_index :comment_threads, :organization_id
    remove_index :comment_threads, :record_id

    add_index :comment_threads, [:record_id, :record_type, :organization_id], unique: true, name: 'index_comment_threads_on_record_and_org'
  end
end
