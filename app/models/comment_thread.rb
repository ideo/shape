class CommentThread < ApplicationRecord
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

  # NOTE: add/remove_follower methods will only get called for editors of the record
  # these only get called within background jobs
  def add_user_follower!(user_id)
    users_threads.find_or_create_by(user_id: user_id)
  end

  def add_group_follower!(group_id)
    groups_thread = groups_threads.find_or_create_by(group_id: group_id)
    # add each user as a follower as well
    groups_thread.group.user_ids.each do |user_id|
      add_user_follower!(user_id)
    end
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
    # anyone who can view the record can contribute to the comment thread
    record.can_view?(user)
  end

  private

  def inherit_record_organization_id
    return true if organization.present?
    self.organization_id = record.organization_id
  end
end
