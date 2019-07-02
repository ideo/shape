module Commentable
  extend ActiveSupport::Concern

  included do
    has_many :comment_threads, as: :record, dependent: :destroy

    after_commit :update_comment_threads_in_firestore, unless: :destroyed?
    if included_modules.include?(Archivable)
      after_archive :remove_comment_followers!
    end
  end

  def comment_thread
    # replacement for former has_one relationship, find the "main" comment_thread
    comment_threads.where(organization_id: organization_id).first
  end

  def remove_comment_followers!
    return unless comment_threads.any?
    comment_threads.each do |ct|
      RemoveCommentThreadFollowers.perform_async(ct.id)
    end
  end

  def update_comment_threads_in_firestore
    return unless comment_threads.any?
    return unless saved_change_to_name? || saved_change_to_cached_attributes?
    comment_threads.each(&:store_in_firestore)
  end
end
