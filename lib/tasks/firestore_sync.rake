namespace :firestore_sync do
  desc 'efficiently reindex models'
  task sync_comments_for_last_week: :environment do
    CommentThread.where(
      'updated_at > ?', 1.week.ago
    ).each do |ct|
      ct.store_in_firestore
      ct.update_firestore_users_threads # <-- this uses the batch writer
    end
  end
end
