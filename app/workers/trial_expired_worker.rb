class TrialExpiredWorker
  include Sidekiq::Worker

  def perform
    Organization.where(
      trial_expired_email_sent: false,
      in_app_billing: true,
    ).where(
      'trial_ends_at < ?', Time.current
    ).find_each do |organization|
      TrialExpiredMailer.notify(organization)
      organization.update_attributes(trial_expired_email_sent: true)
    end
  end
end
