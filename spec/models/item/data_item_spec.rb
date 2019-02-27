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

  describe '#data' do
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
      let!(:item) { create(:data_item, :report_type_collections_and_items) }

      it 'should call the CollectionsAndItems service' do
        expect(DataReport::CollectionsAndItems).to receive(:new)
        expect(collections_and_items_double).to receive(:call)
        item.data
      end
    end

    context 'for network app metric' do
      let!(:item) { create(:data_item, :report_type_network_app_metric) }

      it 'should call the NetworkAppMetric service' do
        expect(DataReport::NetworkAppMetric).to receive(:new)
        expect(network_app_metric_double).to receive(:call)
        item.data
      end
    end

    context 'for record data' do
      let!(:item) { create(:data_item, :report_type_record) }

      it 'should return content' do
        expect(item.data).to eq(item.data_content)
      end

      it 'should not call NetworkAppMetric or CollectionsAndItems service' do
        expect(DataReport::CollectionsAndItems).not_to receive(:new)
        expect(DataReport::NetworkAppMetric).not_to receive(:new)
        item.data
      end
    end
  end
end
