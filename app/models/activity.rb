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

  enum action: [
    :archived,
    :added_editor,
    :added_member,
    :added_admin,
  ]
end
