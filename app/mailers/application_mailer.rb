class ApplicationMailer < ActionMailer::Base
  include Roadie::Rails::Automatic
  include ApplicationHelper

  default from: 'Shape <hello@shape.space>'
  layout 'mailer'
end
