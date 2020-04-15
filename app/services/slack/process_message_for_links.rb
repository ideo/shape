module Slack
  class ProcessMessageForLinks
    include Interactor

    delegate_to_context :event
    require_in_context :event
    delegate :channel, :text, :user, :ts, to: :event

    def call
      return unless run?

      create_collection
    end

    private

    def create_collection
      Slack::InShape::CreateCollectionForLinkMessage.call(
        channel: channel,
        text: text,
        user: user,
        timestamp: ts,
        urls: urls,
      )
    end

    def urls
      urls_in_text.map do |url|
        # Using markdown, it may have a description after a | separator
        url.split('|').first
      end
    end

    def run?
      # TODO why was this "message.channels" before?
      event.type == 'message' && urls_in_text.present?
    end

    # Slack messages use markdown for formatting: https://api.slack.com/reference/surfaces/formatting#linking-urls
    # <https://link.com> or <https://link.com|My Link Text>
    def urls_in_text
      text.scan(/<([^>]*)>/).flatten
    end
  end
end
