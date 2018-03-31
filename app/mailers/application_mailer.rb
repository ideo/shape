class ApplicationMailer < ActionMailer::Base
  include Roadie::Rails::Automatic

  default from: 'Shape <hello@shape.space>'
  layout 'mailer'
end
