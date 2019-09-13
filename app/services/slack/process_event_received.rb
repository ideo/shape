module Slack
  class ProcessEventReceived
    include Interactor
    include Slack::Common

    require_in_context :event

    def call
      respond_to_link_shared if link_shared?
    end

    def respond_to_link_shared
      Slack::Unfurl.call(
        channel: event.channel,
        message_ts: event.message_ts,
        links: event.links,
      )
    end

    private

    def link_shared?
      event.type == 'link_shared'
    end

    def event
      @event ||= Hashie::Mash.new(context.event)
    end
  end
end
