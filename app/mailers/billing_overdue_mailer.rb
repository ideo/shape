class BillingOverdueMailer < ApplicationMailer
  def notify(organization)
    emails = organization.admins[:users].map(&:email)
    @organization_name = organization.name
    @account_freeze_date = (organization.overdue_at + 2.weeks).to_s(:mdy)
    @total_users_count = organization.active_users_count
    @next_monthly_charge = Organization::PRICE_PER_USER * @total_users_count
    @next_statement_date = Time.now.utc.end_of_month.to_s(:mdy)
    @url = "#{root_url}/billing"
    subject = 'Shape Payment Overdue'
    mail to: emails, subject: subject
  end
end
