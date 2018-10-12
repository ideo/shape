require 'rails_helper'

RSpec.describe NetworkCreateUsageRecordWorker, type: :worker do
  describe '#perform' do
    let(:organization1) { create(:organization) }
    let(:organization2) { create(:organization) }

    it 'calls #create_network_usage_record for each Organization' do
      allow(Organization).to receive(:find_each)
        .and_yield(organization1)
        .and_yield(organization2)
      expect(organization1).to receive(:create_network_usage_record)
      expect(organization2).to receive(:create_network_usage_record)
      NetworkCreateUsageRecordWorker.new.perform
    end
  end
end
