module Slack
  class AppMentioned
    include Interactor

    delegate_to_context :event
    require_in_context :event
    delegate :channel, :message_ts, :links, to: :event

    def call
      return unless run?

    end

    private

    def run?
      event.type == 'app_mention'
    end
  end
end
