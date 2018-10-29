class TrialUsersCountExceededWorker
  include Sidekiq::Worker

  def perform
    Organization.where(
      trial_users_count_exceeded_email_sent: false,
      in_app_billing: true,
    ).where(
      'trial_ends_at < ?', Time.current
    ).where(
      Organization.arel_table[:active_users_count].gt(
        Organization.arel_table[:trial_users_count],
      ),
    ).find_each do |organization|
      TrialUsersCountExceededMailer.notify(organization).deliver_now
      organization.update_attributes(trial_users_count_exceeded_email_sent: true)
    end
  end
end
