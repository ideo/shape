class ApplicationMailer < ActionMailer::Base
  default from: 'Shape <hello@shape.space>'
  layout 'mailer'
end
