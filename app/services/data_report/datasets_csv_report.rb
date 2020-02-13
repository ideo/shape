require 'csv'

module DataReport
  class DatasetsCSVReport < SimpleService
    def initialize(datasets:)
      @datasets = datasets
      @primary_dataset = @datasets.first
    end

    def call
      CSV.generate do |csv|
        dates = @primary_dataset.data.map { |d| d['date'] }
        csv << [' '] + dates

        @datasets.each do |ds|
          values = ds.data.map { |d| d['value'] }
          source = ds.name
          if ds.type == 'Dataset::CollectionsAndItems'
            source = ds.data_source.present? ? 'Collection' : 'Organization'
          end
          csv << [source] + values
        end
      end
    end
  end
end
