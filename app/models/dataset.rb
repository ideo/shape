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
#  max_domain       :integer
#  measure          :string
#  name             :string
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

  has_many :data_items_datasets, dependent: :destroy

  has_many :data_items,
           through: :data_items_datasets,
           class_name: 'Item::DataItem'

  validates :timeframe, :chart_type, presence: true
  validates :cached_data, :name, presence: true, if: :root_dataset_class?

  scope :question_items, -> { where(type: 'Dataset::Question') }

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

  searchkick callbacks: :queue

  scope :search_import, -> do
    includes(
      data_source: { parent_collection_card: :parent },
    )
  end

  def search_data
    {
      type: type,
      name: name,
      organization_id: organization_id || data_source&.organization_id,
      question_type: question_type,
      chart_type: chart_type,
      data_source_parent_id: data_source ? data_source.parent.id : nil,
      data_source_parent_type: data_source ? data_source.parent.class.base_class.name : nil,
    }
  end

  # Implement in each sub-class

  def display_name
    name
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
