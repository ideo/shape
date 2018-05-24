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

  enum action: %i[
    archived
    added_editor
    added_member
    added_admin
  ]

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
end
