require 'csv'

module DataReport
  class RecordCSVReport < SimpleService
    def initialize(data_item:)
      @data_item = data_item
      @primary_dataset = data_item.datasets.first
      @datasets = data_item.datasets
    end

    def call
      CSV.generate do |csv|
        dates = @primary_dataset.map { |d| d[:date] }
        csv << [' '] + dates

        @datasets.each do |ds|
          values = ds.map { |d| d[:value] }
          source = ds.name
          csv << [source] + values
        end
      end
    end
  end
end
