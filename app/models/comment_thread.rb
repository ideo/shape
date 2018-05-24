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


  def add_user_follower!(user)
    users_threads.find_or_create_by(user: user)
  end

  def add_group_follower!(group)
    groups_thread = groups_threads.find_or_create_by(group: group)
    groups_thread.add_users_as_followers!
  end

  private

  def inherit_record_organization_id
    return true if organization.present?
    self.organization_id = record.organization_id
  end
end
