require 'rails_helper'

RSpec.describe Item::LegendItem, type: :model do
  let(:legend_item) { create(:legend_item) }
  let!(:data_item) do
    create(
      :data_item,
      :report_type_record,
      legend_item: legend_item)
  end
  let(:primary_dataset) do
    data_item.all_datasets.find { |dataset| dataset[:order].zero? }
  end
  let(:comparison_datasets) do
    data_item.all_datasets.select { |dataset| dataset[:order] > 0 }
  end

  describe '#primary_measure' do
    it 'returns measure with order of 0' do
      expect(legend_item.primary_measure).to eq(
        measure: primary_dataset[:measure],
        style: primary_dataset[:style],
        order: 0
      )
    end
  end

  describe '#comparison_measures' do
    it 'returns measures with order > 0' do
      expect(
        legend_item.comparison_measures,
      ).to eq(
        comparison_datasets.map.with_index do |dataset, i|
          {
            measure: dataset[:measure],
            style: dataset[:style],
            order: i + 1,
          }
        end,
      )
    end
  end
end
