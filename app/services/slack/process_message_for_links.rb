require 'redcarpet'

module Slack
  class ProcessMessageForLinks
    include Interactor

    delegate_to_context :event, :client
    require_in_context :event, :client
    delegate :channel, :text, :user, :ts, to: :event

    # Slack messages use markdown for formatting: https://api.slack.com/reference/surfaces/formatting#linking-urls
    # <https://link.com> or <https://link.com|My Link Text>
    LINK_REGEX = /<([^>\|]*)\|?([^>\|]*)>/.freeze

    def call
      return unless run?

      create_collection
    end

    private

    def create_collection
      Slack::InShape::CreateCollectionForLinkMessage.call(
        channel: channel,
        html_text: html_text,
        user: user,
        timestamp: ts,
        urls: urls,
      )
    end

    def clean_text
      # convert links to "normal" markdown
      # '<https://link.com|My Link Text>' becomes '[My Link Text](https://link.com)'
      text.gsub(LINK_REGEX, '[\2](\1)').strip
    end

    def urls
      text.scan(LINK_REGEX).map(&:first)
    end

    def html_text
      renderer = Redcarpet::Markdown.new(Redcarpet::Render::HTML.new)
      renderer.render(clean_text).html_safe
    end

    def run?
      event.type == 'message' && urls.present?
    end
  end
end
