class TrialUsersCountExceededWorker
  include Sidekiq::Worker

  def perform
    Organization.billable.where(
      trial_users_count_exceeded_email_sent: false,
    ).where(
      'trial_ends_at < ?', Time.current
    ).where(
      '"organizations".active_users_count > "organizations".trial_users_count',
    ).find_each do |organization|
      TrialUsersCountExceededMailer.notify(organization).deliver_later
      organization.update_attributes(trial_users_count_exceeded_email_sent: true)
    end
  end
end
