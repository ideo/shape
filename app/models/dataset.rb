# == Schema Information
#
# Table name: datasets
#
#  id               :bigint(8)        not null, primary key
#  cached_data      :jsonb
#  chart_type       :integer
#  data_source_type :string
#  description      :text
#  groupings        :jsonb
#  identifier       :string
#  max_domain       :integer
#  measure          :string
#  question_type    :string
#  style            :jsonb
#  timeframe        :integer
#  total            :integer
#  type             :string
#  url              :string
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  data_source_id   :bigint(8)
#  organization_id  :bigint(8)
#
# Indexes
#
#  index_datasets_on_data_source_type_and_data_source_id  (data_source_type,data_source_id)
#  index_datasets_on_organization_id                      (organization_id)
#

class Dataset < ApplicationRecord
  belongs_to :organization, optional: true
  belongs_to :data_source, polymorphic: true, optional: true

  has_many :data_items_datasets, dependent: :destroy, inverse_of: :dataset

  has_many :data_items,
           through: :data_items_datasets,
           class_name: 'Item::DataItem'

  validates :timeframe, :chart_type, presence: true
  validates :cached_data, :identifier, presence: true, if: :root_dataset_class?

  scope :question_items, -> { where(type: 'Dataset::Question') }
  scope :without_groupings, -> { where("groupings = '[]'") }

  attr_accessor :cached_data_items_datasets

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

  def grouping
    # NOTE: support for multiple groupings is TBD
    groupings.first
  end

  # Implement in each sub-class

  def name
    identifier
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

  def data_items_datasets_id
    cached_data_items_datasets&.id
  end

  private

  def root_dataset_class?
    type.blank?
  end
end
