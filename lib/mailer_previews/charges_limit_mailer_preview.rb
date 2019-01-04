class ChargesLimitMailerPreview < ActionMailer::Preview
  def notify
    ChargesLimitMailer.notify(Organization.last)
  end
end
