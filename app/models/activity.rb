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
    downloaded: 10,
  }

  def self.role_name_to_action(role_name)
    case role_name
    when Role::EDITOR
      :added_editor
    when Role::MEMBER
      :added_member
    when Role::ADMIN
      :added_admin
    end
  end

  def should_notify?
    %w[
      archived
      added_editor
      added_member
      added_admin
      commented
      mentioned
    ].include? action.to_s
  end

  def no_subjects?
    %w[
      downloaded
    ].include? action.to_s
  end
end
