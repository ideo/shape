require 'rails_helper'

RSpec.describe Item::DataItem, type: :model do
  describe '#data_values' do
    let(:item) { create(:data_item) }
    let(:service_double) { double('DataReport') }

    it 'should call the DataReport service' do
      allow(item).to receive(:report).and_return(service_double)
      expect(service_double).to receive(:call)
      item.data_values
    end
  end
end
