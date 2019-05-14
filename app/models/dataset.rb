class Dataset < ApplicationRecord
  has_many :data_items_datasets,
           class_name: 'DataItemsDatasets'

  has_many :data_items,
           through: :data_items_datasets,
           class_name: 'Item::DataItem'

  belongs_to :data_source, polymorphic: true, optional: true

  validates :timeframe, :chart_type, presence: true
  validates :cached_data, :measure, presence: true, if: :root_dataset_class?

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

  def title; end

  def description; end

  # Can override in each class
  def data
    return cached_data if cached_data.present?
    []
  end

  # Implement in each sub-class
  def total; end

  def data_items_datasets_id
    cached_data_items_datasets&.id
  end

  private

  def root_dataset_class?
    type.blank?
  end
end
