module Slack
  class ProcessEventReceived
    include Interactor::Organizer
    include Interactor::Schema

    schema :event, :client

    before do
      context.event = Mashie.new(context.event) if context.event.present?
      context.client = client
    end

    # An incoming slack event should only hit one of these interactors
    # as they each check for a particular event.type
    organize(
      AppMentioned,
      ProcessMessageForLinks,
      Unfurl,
    )

    private

    def client
      @client ||= Slack::Web::Client.new
    end
  end
end
