# == Schema Information
#
# Table name: activities
#
#  id               :bigint(8)        not null, primary key
#  action           :integer
#  content          :text
#  destination_type :string
#  source_type      :string
#  target_type      :string
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  actor_id         :bigint(8)
#  destination_id   :bigint(8)
#  organization_id  :bigint(8)
#  source_id        :bigint(8)
#  target_id        :bigint(8)
#
# Indexes
#
#  index_activities_action_target_org                       (action,target_type,organization_id)
#  index_activities_on_actor_id                             (actor_id)
#  index_activities_on_created_at                           (created_at)
#  index_activities_on_destination_type_and_destination_id  (destination_type,destination_id)
#  index_activities_on_organization_id                      (organization_id)
#  index_activities_on_source_type_and_source_id            (source_type,source_id)
#  index_activities_on_target_type_and_target_id            (target_type,target_id)
#

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

  # possible target types: Item, Collection, Group
  belongs_to :target, polymorphic: true
  has_many :notifications, dependent: :destroy
  belongs_to :organization
  belongs_to :source, polymorphic: true, optional: true
  belongs_to :destination, polymorphic: true, optional: true

  scope :in_org, ->(organization_id) { where(organization_id: organization_id) }
  scope :where_participated, -> { where(action: participant_actions) }
  scope :where_viewed, -> { where(action: viewer_actions) }
  scope :where_active, -> { where(action: activity_actions) }
  scope :where_content, -> {
    where(action: content_actions, target_type: 'Item')
  }
  scope :join_actors_in_group, ->(group) {
    joins(actor: [users_roles: :role])
      .where(Role.arel_table[:resource_identifier]
      .in(group.identifiers))
  }

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
    moved: 11,
    linked: 12,
    duplicated: 13,
    archived_from_template: 14,
    viewed: 15,
    edited_comment: 16,
  }

  def self.participant_actions
    %i[
      created
      commented
      edited
      replaced
      moved
      duplicated
    ]
  end

  def self.viewer_actions
    %i[viewed]
  end

  def self.activity_actions
    participant_actions + %i[
      archived
      downloaded
    ]
  end

  def self.content_actions
    %i[
      downloaded
      viewed
      duplicated
    ]
  end

  def self.map_move_action(move_action)
    case move_action
    when 'move'
      :moved
    when 'link'
      :linked
    when 'duplicate'
      :duplicated
    end
  end

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
      archived_from_template
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
