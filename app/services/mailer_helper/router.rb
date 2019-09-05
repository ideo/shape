module MailerHelper
  class Router
    include Rails.application.routes.url_helpers
    include ApplicationHelper

    def self.default_url_options
      ActionMailer::Base.default_url_options
    end
  end
end
