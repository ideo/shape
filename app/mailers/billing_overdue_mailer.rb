class BillingOverdueMailer < ApplicationMailer
  def notify(organization)
    emails = organization.admins[:users].map(&:email)
    @organization_name = organization.name
    @account_freeze_date = (organization.overdue_at + 2.weeks).to_s(:mdy)
    @url = "#{root_url}/billing"
    subject = 'Shape Payment Overdue'
    mail to: emails, subject: subject
  end
end
