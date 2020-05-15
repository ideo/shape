module Slack
  class AppMentioned
    include Interactor

    delegate_to_context :event
    require_in_context :event
    delegate :channel, :message_ts, :links, to: :event

    def call
      return unless run?

      find_or_create_channel_search_collection
      # TODO: read last 3 months of slack messages, find links, create link collections for each link
    end

    private

    def find_or_create_channel_search_collection
      Slack::InShape::CreateChannelSearchCollection.call(
        channel: channel,
      )
    end

    def run?
      event.type == 'app_mention'
    end
  end
end
