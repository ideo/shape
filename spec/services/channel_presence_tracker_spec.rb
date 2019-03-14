require 'rails_helper'

RSpec.describe ChannelPresenceTracker do
  before do
    ChannelPresenceTracker.track('ItemEditingChannel', 123)
    ChannelPresenceTracker.track('TextEditingChannel', 123)
  end

  describe '#current_subscriptions' do
    it 'should return all current subscriptions' do
      subscriptions = ChannelPresenceTracker.current_subscriptions
      expect(subscriptions.size).to eq 2
    end
  end

  describe '#track' do
    it 'should add the user to redis' do
      allow_any_instance_of(Redis).to receive(:sadd).and_return(true)

      expect_any_instance_of(Redis).to receive(:sadd).with(
        ChannelPresenceTracker::CACHE_KEY,
        'TextEditingChannel-123',
      )

      ChannelPresenceTracker.track('TextEditingChannel', 123)
    end
  end

  describe '#untrack' do
    before do
      ChannelPresenceTracker.track('ItemEditingChannel', 345)
    end

    it 'should remove a user if untracked on the correct channel' do
      subscriptions = ChannelPresenceTracker.current_subscriptions
      expect(subscriptions.size).to eq 3
      ChannelPresenceTracker.untrack('ItemEditingChannel', 123)
      expect(ChannelPresenceTracker.current_subscriptions.size).to eq 2
    end

    it 'should call redis srem with the channel and user' do
      allow_any_instance_of(Redis).to receive(:srem).and_return(true)

      expect_any_instance_of(Redis).to receive(:srem).with(
        ChannelPresenceTracker::CACHE_KEY,
        'TextEditingChannel-123',
      )

      ChannelPresenceTracker.untrack('TextEditingChannel', 123)
    end
  end
end
