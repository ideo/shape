class CommentThread < ApplicationRecord
  include HasActivities
  include Firestoreable

  belongs_to :record,
             polymorphic: true
  # org comes from the item/collection, but cached on here for easy lookup
  belongs_to :organization
  before_validation :inherit_record_organization_id, on: :create

  has_many :comments,
           -> { order(updated_at: :desc) },
           dependent: :destroy
  has_many :users_threads, dependent: :destroy
  has_many :groups_threads, dependent: :destroy

  after_update :update_firestore_users_threads

  def unread_comments_for(user)
    ut = users_threads.where(user_id: user.id).first
    return [] unless ut.present?
    comments
      .order(updated_at: :desc)
      .where('updated_at > ?', ut.last_viewed_at)
  end

  def users_thread_for(user)
    users_threads.where(user_id: user.id).first
  end

  def unread_comment_count_for(user)
    unread_comments_for(user).count
  end

  def latest_unread_comments_for(user)
    unread = unread_comments_for(user)
    return [] unless unread.present?
    unread.limit(3)
  end

  def viewed_by!(user)
    ut = users_threads.where(user_id: user.id).first
    return unless ut.present?
    ut.update_last_viewed!
    ut.store_in_firestore
  end

  # NOTE: add/remove_follower methods will only get called for editors of the record
  # these only get called within background jobs
  def add_user_follower!(user_id)
    users_threads.find_or_create_by(user_id: user_id)
  rescue ActiveRecord::RecordNotUnique
    # to make it threadsafe, see: https://apidock.com/rails/ActiveRecord/Relation/find_or_create_by
    # in the case where it already ran before, no need to do anything
    nil
  end

  def add_group_follower!(group_id)
    groups_thread = groups_threads.find_or_create_by(group_id: group_id)
    # add each user as a follower as well
    groups_thread.group.user_ids.each do |user_id|
      add_user_follower!(user_id)
    end
  rescue ActiveRecord::RecordNotUnique
    nil
  end

  # `user_ids` can be single id or array
  def remove_user_followers!(user_ids, force: false)
    if force
      users_threads.where(user_id: user_ids).destroy_all
    else
      User.where(id: user_ids).each do |user|
        # if user still has access to this thread, then carry on
        next if can_edit?(user)
        users_threads.where(user_id: user.id).destroy_all
      end
    end
  end

  def remove_group_followers!(group_ids)
    groups_threads.where(group_id: group_ids).destroy_all
    user_ids = Group.where(id: group_ids).map(&:user_ids).flatten
    remove_user_followers!(user_ids)
  end

  def can_edit?(user)
    return false if record.archived?
    # anyone who can view the record can contribute to the comment thread
    record.can_view?(user)
  end

  def serialized_for_firestore
    renderer = JSONAPI::Serializable::Renderer.new
    renderer.render(
      self,
      class: Firestoreable::JSONAPI_CLASS_MAPPINGS,
      include: %i[record],
    )
  end

  # TODO: when to call firestore deletions....
  def delete_from_firestore
    FirestoreClient.client.batch do |batch|
      batch.delete("comment_threads/#{id}")
      users_threads.each do |ut|
        batch.delete("users_threads/#{ut.id}")
      end
      comments.each do |c|
        batch.delete("comments/#{c.id}")
      end
    end
  end

  def update_firestore_users_threads
    # we want the serialized users_threads to store the comment_thread.updated_at
    # so that within firestore you can get the "20 most recent"
    FirestoreBatchWriter.perform_in(
      3.seconds,
      users_threads.compact.map(&:batch_job_identifier),
    )
  end

  def subscribe!(user)
    toggle_subscribed(true, user)
  end

  def unsubscribe!(user)
    toggle_subscribed(false, user)
  end

  private

  def inherit_record_organization_id
    return true if organization.present?
    self.organization_id = record.organization_id
  end

  def toggle_subscribed(to_subscribe, user)
    users_thread = users_threads.find_or_create_by(user_id: user.id)
    return false if users_thread.nil?
    users_thread.subscribed = to_subscribe
    users_thread.save
    update_firestore_users_threads
    users_thread
  end
end
