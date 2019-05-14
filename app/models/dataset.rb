class Dataset < ApplicationRecord
  has_many :data_items_datasets,
           class_name: 'DataItemsDatasets'

  has_many :data_items,
           through: :data_items_datasets,
           class_name: 'Item::DataItem'

  belongs_to :data_source, polymorphic: true, optional: true

  validates :timeframe, :chart_type, presence: true

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

  def data
    # Implement in your class
  end

  def total
    # Implement in each sub-class
  end
end
