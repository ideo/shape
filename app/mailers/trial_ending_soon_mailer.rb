class TrialEndingSoonMailer < ApplicationMailer
  def notify(organization, days_from_now)
    users = organization.admins[:users]
    emails = users.map(&:email)
    @organization_name = organization.name
    @expiration_date = organization.trial_ends_at.to_s(:mdy)
    ending_in = case days_from_now
                when 2
                  '2 days'
                when 7
                  '1 week'
                when 14
                  '2 weeks'
                end
    @ending_in = "ending in #{ending_in}"
    @url = "#{root_url}billing"
    subject = "Shape trial #{@ending_in} - Add payment method"
    mail to: emails, subject: subject, users: users
  end
end
