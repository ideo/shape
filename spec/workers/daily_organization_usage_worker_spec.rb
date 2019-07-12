require 'rails_helper'

RSpec.describe DailyOrganizationUsageWorker, type: :worker do
  let!(:organizations) { create_list(:organization_without_groups, 2) }

  describe '#perform' do
    it 'queues up NetworkCreateUsageRecordWorkers' do
      expect(NetworkCreateUsageRecordWorker).to receive(:perform_async).twice
      DailyOrganizationUsageWorker.new.perform
    end
  end
end
