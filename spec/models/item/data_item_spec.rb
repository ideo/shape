require 'rails_helper'

RSpec.describe Item::DataItem, type: :model do
  describe 'validations' do
    context 'for Shape collections and items' do
      let(:item) { create(:data_item, :report_type_collections_and_items) }

      it 'should validate that d_measure is one the valid measures' do
        expect(item.update(d_measure: 'something_bad')).to eq(false)
        expect(item.errors).to match_array(
          ['Data settings measure must be one of participants, viewers, activity, content, collections, items, records'],
        )
        expect(item.update(d_measure: 'viewers')).to eq(true)
        expect(item.errors.empty?).to be true
      end

      it 'should validate that d_timeframe is one the valid timeframes' do
        expect(item.update(d_timeframe: 'something_bad')).to eq(false)
        expect(item.errors).to match_array(['Data settings timeframe must be one of ever, month, week'])
        expect(item.update(d_timeframe: 'week')).to eq(true)
        expect(item.errors.empty?).to be true
      end
    end
  end

  describe 'callbacks' do
    describe '#create_legend_item' do
      let(:collection) { create(:collection) }

      context 'for report_type_collections_and_items' do
        it 'does not create a legend' do
          expect {
            create(
              :data_item,
              :report_type_collections_and_items,
              parent_collection: collection,
            )
          }.not_to change(Item::LegendItem, :count)
        end
      end

      context 'for report_type_record' do
        it 'creates and links a Item::LegendItem' do
          expect {
            create(
              :data_item,
              :report_type_record,
              parent_collection: collection,
            )
          }.to change(Item::LegendItem, :count).by(1)
        end

        context 'if legend already exists' do
          let!(:legend_item) { create(:legend_item) }

          it 'does not create legend if already assigned' do
            expect {
              create(
                :data_item,
                :report_type_collections_and_items,
                legend_item: legend_item,
                parent_collection: collection,
              )
            }.not_to change(Item::LegendItem, :count)
          end
        end
      end
    end
  end

  describe '#datasets' do
    let(:network_app_metric_double) { double('DataReport::NetworkAppMetric', call: true) }
    let(:collections_and_items_double) { double('DataReport::CollectionsAndItems', call: true) }

    before do
      allow(DataReport::NetworkAppMetric).to receive(:new).and_return(
        network_app_metric_double,
      )
      allow(DataReport::CollectionsAndItems).to receive(:new).and_return(
        collections_and_items_double,
      )
    end

    context 'for Shape collections and items' do
      let!(:data_item) { create(:data_item, :report_type_collections_and_items) }

      it 'should call the CollectionsAndItems service' do
        expect(DataReport::CollectionsAndItems).to receive(:new)
        expect(collections_and_items_double).to receive(:call)
        data_item.datasets
      end
    end

    context 'for network app metric' do
      let!(:data_item) { create(:data_item, :report_type_network_app_metric) }

      it 'should call the NetworkAppMetric service' do
        expect(DataReport::NetworkAppMetric).to receive(:new)
        expect(network_app_metric_double).to receive(:call)
        data_item.datasets
      end
    end

    context 'for record data' do
      let(:collection) { create(:collection) }
      let!(:data_item) do
        create(
          :data_item,
          :report_type_record,
          parent_collection: collection,
        )
      end
      let(:legend) { data_item.legend_item }

      it 'should return datasets' do
        expect(
          data_item.datasets,
        ).to eq(
          data_item.data_content['datasets'].map(&:deep_symbolize_keys),
        )
      end

      it 'should not call NetworkAppMetric or CollectionsAndItems service' do
        expect(DataReport::CollectionsAndItems).not_to receive(:new)
        expect(DataReport::NetworkAppMetric).not_to receive(:new)
        data_item.datasets
      end

      it 'does not filter if selected_measures is blank' do
        expect(legend.selected_measures.blank?).to be true
        expect(
          data_item.all_datasets.map { |dataset| dataset[:measure] },
        ).to match_array(
          data_item.datasets.map { |dataset| dataset[:measure] },
        )
      end

      context 'with legend item that has selected measures' do
        let(:first_measure) { data_item.all_datasets.first[:measure] }
        before do
          legend.update(selected_measures: first_measure)
        end

        it 'filters datasets if selected_measures if present' do
          expect(
            [first_measure],
          ).to match_array(
            data_item.datasets.map { |dataset| dataset[:measure] },
          )
        end
      end
    end
  end
end
