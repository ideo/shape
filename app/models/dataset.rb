class Dataset < ApplicationRecord
  has_many :data_items_datasets,
           class_name: 'DataItemsDatasets', dependent: :destroy

  has_many :data_items,
           through: :data_items_datasets,
           class_name: 'Item::DataItem'

  belongs_to :data_source, polymorphic: true, optional: true

  validates :timeframe, :chart_type, presence: true
  validates :cached_data, :measure, presence: true, if: :root_dataset_class?

  scope :question_items, -> { where(type: 'Dataset::QuestionItem') }

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

  # Implement in each sub-class

  def title; end

  def description; end

  def total; end

  def single_value; end

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
