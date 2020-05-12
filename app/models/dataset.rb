# == Schema Information
#
# Table name: datasets
#
#  id               :bigint(8)        not null, primary key
#  anyone_can_view  :boolean          default(TRUE)
#  cached_data      :jsonb
#  chart_type       :integer
#  data_source_type :string
#  description      :text
#  groupings        :jsonb
#  identifier       :string
#  max_domain       :integer
#  measure          :string
#  name             :string
#  question_type    :string
#  style            :jsonb
#  tiers            :jsonb
#  timeframe        :integer
#  total            :integer
#  type             :string
#  url              :string
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  application_id   :integer
#  data_source_id   :bigint(8)
#  organization_id  :bigint(8)
#
# Indexes
#
#  index_datasets_on_anyone_can_view                      (anyone_can_view)
#  index_datasets_on_data_source_type_and_data_source_id  (data_source_type,data_source_id)
#  index_datasets_on_organization_id                      (organization_id)
#

class Dataset < ApplicationRecord
  include Externalizable
  include Resourceable
  belongs_to :organization, optional: true
  belongs_to :data_source, polymorphic: true, optional: true
  belongs_to :application, optional: true

  resourceable roles: [Role::VIEWER],
               view_role: Role::VIEWER

  has_many :data_items_datasets, dependent: :destroy, inverse_of: :dataset

  has_many :data_items,
           through: :data_items_datasets,
           class_name: 'Item::DataItem'

  validates :timeframe, :chart_type, presence: true
  validates :cached_data, :identifier, presence: true, if: :root_dataset_class?

  scope :question_items, -> { where(type: 'Dataset::Question') }
  scope :without_groupings, -> { where("groupings = '[]'") }
  scope :anyone_can_view, -> { where(anyone_can_view: true) }
  scope :viewable_by_user, ->(user) {
    group_ids = user.all_current_org_group_ids

    joined = all.where(anyone_can_view: false)
                .left_joins(roles: %i[users_roles groups_roles])

    anyone_can_view
      .union(
        joined.where(UsersRole.arel_table[:user_id].eq(user.id)).or(
          joined.where(GroupsRole.arel_table[:group_id].in(group_ids)),
        ),
      ).distinct
  }

  attr_accessor :cached_data_items_datasets
  # start_date_limit can be temp overridden to extend past imposed 12 month limit
  attr_accessor :start_date_limit

  delegate :order, :selected,
           to: :cached_data_items_datasets,
           allow_nil: true

  enum timeframe: {
    ever: 0,
    month: 1,
    week: 2,
  }

  enum chart_type: {
    bar: 0,
    area: 1,
    line: 2,
  }

  amoeba do
    enable
    recognize []
    propagate
  end

  def self.identifier_for_object(object)
    "#{object.class.base_class.name}-#{object.id}"
  end

  def self.default_includes_for_api
    %i[group]
  end

  def link_when_duplicating?
    # Link (instead of duplicating)
    # If a dataset was created by an application,
    # or has more than one data item
    return true if application.present? || data_items.count > 1

    # Otherwise, it can be duplicated
    false
  end

  def grouping
    # NOTE: support for multiple groupings is TBD
    groupings.first
  end

  def group
    return nil unless group_by_type_id('Group').present?

    Group.find(group_by_type_id('Group'))
  end

  def group_by_type_id(type)
    groupings.find { |g| g['type'] == type }.try(:[], 'id')
  end

  def grouping_objects
    groupings.map do |grouping|
      klass = grouping['type'].safe_constantize

      next if klass.blank? || grouping['id'].blank?

      klass.find_by(id: grouping['id'].to_i)
    end.compact
  end

  # Implement in each sub-class

  def name
    self[:name] || identifier
  end

  def title; end

  def description; end

  def total; end

  def single_value; end

  def test_collection_id; end

  def data
    return cached_data if cached_data.present?

    []
  end

  # End of methods to (potentially) implement in each sub-class

  def mashie_data
    data.map { |d| Mashie.new(d) }
  end

  def data_items_datasets_id
    cached_data_items_datasets&.id
  end

  # Added so that this is compatible with rolify
  def roles_anchor_collection_id; end

  private

  def root_dataset_class?
    type.blank?
  end
end
