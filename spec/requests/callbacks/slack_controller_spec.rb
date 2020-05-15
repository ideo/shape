require 'rails_helper'
include ApplicationHelper

describe 'Slack API Requests' do
  let(:client_double) { double('slack') }

  before do
    # turn CSRF protection on to test that we are bypassing it
    ActionController::Base.allow_forgery_protection = true
    allow(client_double).to receive(:chat_unfurl)
    allow(Slack::Web::Client).to receive(:new).and_return(client_double)
  end

  after do
    ActionController::Base.allow_forgery_protection = false
  end

  describe 'POST #event' do
    context 'event = link_shared (unfurling links)' do
      let!(:organization) { create(:organization, slug: 'ideo') }
      let!(:collection) { create(:collection, organization: organization) }
      let!(:item) { create(:text_item, parent_collection: collection) }
      let(:collection_url) { frontend_url_for(collection) }
      let(:item_url) { frontend_url_for(item) }

      # https://api.slack.com/docs/message-link-unfurling#unfurls_parameter
      let(:params) do
        {
          token: 'XXYYZZ',
          team_id: 'TXXXXXXXX',
          api_app_id: 'AXXXXXXXXX',
          event: {
            type: 'link_shared',
            channel: 'Cxxxxxx',
            user: 'Uxxxxxxx',
            message_ts: '123452389.9875',
            thread_ts: '123456621.1855',
            links: [
              { domain: 'shape.space', url: collection_url },
              { domain: 'shape.space', url: item_url },
              { domain: 'shape.space', url: 'https://shape.space/unsupported/url' },
            ],
          },
          type: 'event_callback',
          authed_users: %w[UXXXXXXX1 UXXXXXXX2],
          event_id: 'Ev08MFMKH6',
          event_time: 123_456_789,
        }
      end

      it 'returns a 200 OK' do
        post(
          '/callbacks/slack/event',
          params: params,
        )
        expect(response.status).to eq 200
      end

      it 'calls Slack::ProcessEventReceived service' do
        expect(Slack::ProcessEventReceived).to receive(:call).with(event: ActionController::Parameters.new(params[:event]))
        post(
          '/callbacks/slack/event',
          params: params,
        )
      end

      it 'calls Slack client unfurl method with updated rich media' do
        # NOTE: this is testing the internals of Slack::ProcessEventReceived
        expect(client_double).to receive(:chat_unfurl).with(
          channel: params[:event][:channel],
          ts: params[:event][:message_ts],
          # unfurls is a JSON encoded string so this is just a simple check
          unfurls: anything,
        )
        post(
          '/callbacks/slack/event',
          params: params,
        )
      end
    end
  end
end
