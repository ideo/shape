require 'rails_helper'

RSpec.describe Item::DataItem, type: :model do
  describe 'validations' do
    let(:item) { create(:data_item) }

    it 'should validate that d_measure is one the valid measures' do
      expect(item.update(d_measure: 'something_bad')).to eq(false)
      expect(item.errors).to match_array(['Data settings measure must be one of participants, viewers, activity'])
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
  describe '#data_values' do
    let(:item) { create(:data_item) }
    let(:service_double) { double('DataReport') }

    it 'should call the DataReport service' do
      allow(item).to receive(:report).and_return(service_double)
      expect(service_double).to receive(:call)
      item.data
    end
  end
end
