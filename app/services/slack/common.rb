module Slack
  module Common
    def client
      @client ||= Slack::Web::Client.new
    end
  end
end
