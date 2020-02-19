require 'rails_helper'

RSpec.describe DataReport::DatasetsCSVReport, type: :service do
  let(:csv_data) { DataReport::DatasetsCSVReport.call(datasets: [dataset]) }
  let(:first_line) { csv_data.split("\n").first.split(',') }
  let(:second_line) { csv_data.split("\n").second.split(',') }

  context 'shape report' do
    let(:dataset) { create(:collections_and_items_dataset) }

    before do
      allow_any_instance_of(
        Dataset::CollectionsAndItems,
      ).to receive(:data).and_return(
        [
          { date: '2019-10-10', value: 12 },
          { date: '2019-11-10', value: 15 },
          { date: '2019-12-10', value: 19 },
        ],
      )
    end

    it 'should add each date in the top row' do
      expect(first_line[1]).to eq '2019-10-10'
      expect(first_line[2]).to eq '2019-11-10'
    end

    it 'should have "Collection" in the second row' do
      expect(second_line[0]).to eq 'Collection'
    end

    it 'should put the values after the source field on 2nd row' do
      expect(second_line[1]).to eq '12'
      expect(second_line[2]).to eq '15'
      expect(second_line[3]).to eq '19'
    end

    context 'when theres no data source' do
      before do
        dataset.update(data_source: nil)
      end

      it 'should have "Organization" in the second row' do
        second_line = csv_data.split("\n").second.split(',')
        expect(second_line[0]).to eq 'Organization'
      end
    end
  end

  context 'creative difference report' do
    let(:dataset) { create(:dataset, :with_cached_data, name: 'Purpose') }
    let(:dataset_a) { create(:dataset, :with_cached_data, name: 'Innovation') }
    let(:third_line) { csv_data.split("\n").third.split(',') }
    let(:csv_data) { DataReport::DatasetsCSVReport.call(datasets: [dataset, dataset_a]) }

    before do
      dataset.cached_data = [
        { date: '2020-01-02', value: 80 },
        { date: '2020-02-02', value: 120 },
      ]
      dataset_a.cached_data = [
        { date: '2019-12-02', value: 15 },
        { date: '2020-01-02', value: 25 },
        { date: '2020-02-02', value: 30 },
      ]
      dataset.save
      dataset.reload
      dataset_a.save
      dataset_a.reload
    end

    it 'should add each date in the top row' do
      expect(first_line[1]).to eq '2019-12-02'
      expect(first_line[2]).to eq '2020-01-02'
      expect(first_line[3]).to eq '2020-02-02'
    end

    it 'should include the dataset name in the first column 2nd row' do
      expect(second_line[0]).to eq dataset.name
    end

    it 'should put the values after the source field on 2nd row' do
      expect(second_line[2]).to eq '80'
      expect(second_line[3]).to eq '120'
    end

    it 'should put the second dataset on the next line' do
      expect(third_line[1]).to eq '15'
      expect(third_line[2]).to eq '25'
      expect(third_line[3]).to eq '30'
    end

    context 'with some data that has no dates' do
      before do
        dataset_a.cached_data = [
          { value: 15 },
          { value: 25 },
        ]
      end

      it 'should only generate the datasets with dates' do
        expect(first_line).to eq([
          ' ', '2020-01-02', '2020-02-02'
        ])
        expect(second_line).to eq(%w[
          Purpose 80 120
        ])
        expect(third_line).to eq([
          'Innovation', ' ', ' '
        ])
      end
    end
  end
end
