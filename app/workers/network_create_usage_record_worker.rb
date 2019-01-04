class NetworkCreateUsageRecordWorker
  include Sidekiq::Worker

  def perform
    Organization.find_each do |organization|
      active_users_count = organization.active_users_count

      next unless organization.create_network_usage_record &&
                  organization.in_app_billing &&
                  !organization.deactivated? &&
                  !organization.within_trial_period?

      new_active_users_count = organization.reload.active_users_count - active_users_count
      next unless new_active_users_count.positive?

      BillingChangesMailer.notify(organization, new_active_users_count).deliver_later
    end
  end
end
