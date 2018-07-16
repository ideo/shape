class Activity < ApplicationRecord
  belongs_to :actor, class_name: 'User'
  has_many :activity_subjects
  has_many :subject_users,
           through: :activity_subjects,
           source: :subject,
           source_type: 'User'
  has_many :subject_groups,
           through: :activity_subjects,
           source: :subject,
           source_type: 'Group'

  belongs_to :target, polymorphic: true
  has_many :notifications, dependent: :destroy
  belongs_to :organization

  # add explicit values so it's not tied to the order of the array
  enum action: {
    archived: 0,
    added_editor: 1,
    added_member: 2,
    added_admin: 3,
    commented: 4,
    mentioned: 5,
    created: 6,
    edited: 7,
    replaced: 8,
    joined: 9,
  }

  def self.role_name_to_action(role_name)
    case role_name
    when Role::EDITOR
      Activity.actions[:added_editor]
    when Role::MEMBER
      Activity.actions[:added_member]
    when Role::ADMIN
      Activity.actions[:added_admin]
    end
  end

  def should_notify?
    [
      Activity.actions[:archived],
      Activity.actions[:added_editor],
      Activity.actions[:added_member],
      Activity.actions[:added_admin],
      Activity.actions[:commented],
      Activity.actions[:mentioned],
    ].include? action
  end
end
