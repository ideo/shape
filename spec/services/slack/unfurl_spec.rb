require 'rails_helper'

RSpec.describe Slack::Unfurl, type: :service do
  describe '#call' do
    let(:client_double) { double('client') }
    let(:cover_text) { 'Description here.' }
    let!(:collection) { create(:collection, cached_cover: { text: cover_text }) }
    let(:url) { "https://shape.space/org/collections/#{collection.id}" }
    let(:channel) { 'chatroom' }
    let(:message_ts) { 'timestamp-123-123' }
    let(:unfurled_link) do
      {
        mrkdwn_in: %w[text pretext],
        author_name: 'Shape',
        author_icon: 'https://s3-us-west-2.amazonaws.com/assets.shape.space/logo-no-text_2x-sq.png',
        color: '#5698ae',
        title: collection.name,
        text: cover_text,
        title_link: url,
        image_url: '',
      }
    end
    let(:unfurls) do
      {
        url => unfurled_link,
      }
    end
    let(:event) do
      Mashie.new(
        links: [{ url: url }],
        channel: channel,
        message_ts: message_ts,
        type: 'link_shared',
      )
    end

    subject do
      Slack::Unfurl.new(
        client: client_double,
        event: event,
      )
    end

    before do
      allow(client_double).to receive(:chat_unfurl)
    end

    it 'parses each url and returns the proper unfurl data' do
      expect(client_double).to receive(:chat_unfurl).with(
        channel: channel,
        ts: message_ts,
        unfurls: unfurls.to_json,
      )
      subject.call
    end

    context 'with hardcoded subtitle' do
      let(:cover_text) { 'hardcoded.' }
      let!(:collection) { create(:collection, cached_cover: { hardcoded_subtitle: cover_text }) }

      it 'uses the hardcoded_subtitle in the unfurl text' do
        expect(client_double).to receive(:chat_unfurl).with(
          channel: channel,
          ts: message_ts,
          unfurls: unfurls.to_json,
        )
        subject.call
      end
    end

    context 'with subtitle hidden' do
      let(:cover_text) { '' }
      let!(:collection) { create(:collection, cached_cover: { hardcoded_subtitle: 'hardcoded...', subtitle_hidden: true }) }

      it 'uses blank subtitle in the unfurl text' do
        expect(client_double).to receive(:chat_unfurl).with(
          channel: channel,
          ts: message_ts,
          unfurls: unfurls.to_json,
        )
        subject.call
      end
    end
  end
end
