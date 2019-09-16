class AddParentToCommentThread < ActiveRecord::Migration[5.2]
  def change
    add_reference :comment_threads, :parent
    remove_index :comment_threads, name: 'index_comment_threads_on_record_and_org'
  end
end
