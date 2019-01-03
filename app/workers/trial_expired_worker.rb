class TrialExpiredWorker
  include Sidekiq::Worker

  def perform
    Organization.billable.where(
      trial_expired_email_sent: false,
    ).where(
      'trial_ends_at < ?', Time.current
    ).find_each do |organization|
      TrialExpiredMailer.notify(organization).deliver_later
      organization.update_attributes(trial_expired_email_sent: true)
    end
  end
end
