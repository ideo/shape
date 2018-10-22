class TrialUsersCountExceededMailer < ApplicationMailer
  def notify(organization)
    emails = organization.admins[:users].map(&:email)
    subject = 'Free trial limit preached'
    @organization_name = organization.name
    @total_users_count = organization.active_users_count
    @trial_users_count = organization.trial_users_count
    @prorated_users_count = @total_users_count - @trial_users_count
    @next_monthly_charge = Organization::PRICE_PER_USER * @prorated_users_count
    @expiration_date = organization.trial_ends_at.to_s(:mdy)
    @next_statement_date = Time.now.utc.end_of_month.to_s(:mdy)
    @missing_payment_method = NetworkApi::PaymentMethod.find(organization_id: organization.network_organization.id).empty?
    @url = "#{root_url}/billing"
    mail to: emails, subject: subject
  end
end
