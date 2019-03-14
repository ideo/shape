require 'rails_helper'

RSpec.describe LogChannelSubscribersWorker, type: :worker do
  describe '#perform' do
    before do
      allow(ChannelPresenceTracker).to receive(:current_subscriptions).and_return([
        'ItemEditingChannel-123',
        'ItemEditingChannel-9112',
        'ItemEditingChannel-456',
        'CollectionEditingChannel-123',
        'TextEditingChannel-456',
      ])
      LogChannelSubscribersWorker.new.perform
    end

    it 'adds a count for each subscribers channel' do
      expect(AppMetric.count).to eq 3
      expect(AppMetric.find_by(metric: 'subscribers-ItemEditingChannel').value).to eq 3
    end
  end
end
