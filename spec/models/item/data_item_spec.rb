require 'rails_helper'

RSpec.describe Item::DataItem, type: :model do
  describe 'callbacks' do
    describe '#create_legend_item' do
      let(:collection) { create(:collection) }

      context 'for report_type_collections_and_items' do
        it 'does not create a legend' do
          expect do
            create(
              :data_item,
              :report_type_collections_and_items,
              parent_collection: collection,
            )
          end.not_to change(Item::LegendItem, :count)
        end
      end

      context 'for report_type_record' do
        it 'creates and links a Item::LegendItem' do
          expect do
            create(
              :data_item,
              :report_type_record,
              parent_collection: collection,
            )
          end.to change(Item::LegendItem, :count).by(1)
        end

        context 'if legend already exists' do
          let!(:legend_item) { create(:legend_item) }

          it 'does not create legend if already assigned' do
            expect do
              create(
                :data_item,
                :report_type_collections_and_items,
                legend_item: legend_item,
                parent_collection: collection,
              )
            end.not_to change(Item::LegendItem, :count)
          end
        end
      end
    end
  end

  describe '#duplicate' do
    let(:collection) { create(:collection) }
    let!(:data_item) { create(:data_item, :report_type_record) }
    let(:dataset) { data_item.datasets.first }

    it 'does duplicate the dataset' do
      expect(dataset.data_items.size).to eq(1)
      expect do
        data_item.duplicate!(
          parent: collection,
        )
      end.to change(Dataset, :count).by(1)
    end

    context 'if dataset is linked to multiple data items' do
      let!(:data_item_two) { create(:data_item, :report_type_record) }
      before do
        data_item_two.data_items_datasets.first.update(
          dataset_id: dataset.id,
        )
      end

      it 'links / does not duplicate the dataset' do
        expect(dataset.data_items.size).to eq(2)
        expect do
          data_item.duplicate!(
            parent: collection,
          )
        end.not_to change(Dataset, :count)
      end
    end

    context 'if dataset was created by application' do
      before do
        dataset.update(application: create(:application))
      end

      it 'links / does not duplicate the dataset' do
        expect(dataset.data_items.size).to eq(1)
        expect do
          data_item.duplicate!(
            parent: collection,
          )
        end.not_to change(Dataset, :count)
      end
    end
  end

  describe '#create_dataset' do
    let!(:data_item) { create(:data_item, :report_type_record, dataset_type: nil) }
    let(:params) do
      {
        order: 2,
        selected: false,
        chart_type: :bar,
        measure: 'something',
        timeframe: 'ever',
        identifier: 'Something That is Great',
        cached_data: [
          { date: '2019-04-01', value: 987_654_321 },
        ],
      }
    end

    it 'creates dataset' do
      expect do
        data_item.create_dataset(params)
      end.to change(Dataset, :count).by(1)
    end

    it 'slices params out to data_items_dataset' do
      dataset = data_item.create_dataset(params)
      data_items_dataset = dataset.data_items_datasets.first
      expect(data_items_dataset.order).to eq(2)
      expect(data_items_dataset.selected).to be false
    end
  end
end
