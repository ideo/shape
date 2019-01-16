class BillingOverdueMailerPreview < ActionMailer::Preview
  def notify
    BillingOverdueMailer.notify(Organization.last)
  end
end
