require 'rails_helper'

RSpec.describe Slack::ProcessMessageForLinks, type: :service do
  describe '#call' do
    let(:client) { double('client') }
    let(:event) do
      Mashie.new(
        type: 'message',
        channel: 'channel',
        user: 'U2147483697',
        text: 'Live long and prosper. <https://google.com|My Link>',
        ts: '1355517523.000005',
        event_ts: '1355517523.000005',
        channel_type: 'channel',
      )
    end

    subject do
      Slack::ProcessMessageForLinks.new(
        event: event,
        client: client,
      )
    end

    it 'calls CreateCollectionForLinkMessage' do
      expect(Slack::InShape::CreateCollectionForLinkMessage).to receive(:call).with(
        channel: event.channel,
        html_text: "<p>Live long and prosper. <a href=\"https://google.com\">My Link</a></p>\n",
        user: event.user,
        timestamp: event.ts,
        urls: %w[https://google.com],
      )
      subject.call
    end
  end
end
