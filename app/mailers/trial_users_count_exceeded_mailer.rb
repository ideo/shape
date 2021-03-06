class TrialUsersCountExceededMailer < ApplicationMailer
  def notify(organization)
    users = organization.admins[:users]
    emails = users.map(&:email)
    subject = 'Free trial limit reached'
    @organization_name = organization.name
    @total_users_count = organization.active_users_count
    @trial_users_count = organization.trial_users_count
    @prorated_users_count = @total_users_count - @trial_users_count
    @next_monthly_charge = Organization::PRICE_PER_USER * @prorated_users_count
    @expiration_date = organization.trial_ends_at.to_s(:mdy)
    @next_statement_date = Time.now.utc.end_of_month.to_s(:mdy)
    @missing_payment_method = !organization.has_payment_method?
    @url = "#{root_url}billing"
    mail to: emails, subject: subject, users: users
  end
end
