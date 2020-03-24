module Slack
  class ProcessEventReceived
    include Interactor::Organizer

    require_in_context :event

    before do
      context.event = Hashie::Mash.new(context.event) if context.event.present?
    end

    organize ProcessMessageForLinks, AppMentioned, Unfurl

    private

    def client
      @client ||= Slack::Web::Client.new
    end
  end
end
