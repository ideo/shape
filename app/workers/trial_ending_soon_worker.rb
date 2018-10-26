class TrialEndingSoonWorker
  include Sidekiq::Worker

  def perform
    Organization.where(
      in_app_billing: true,
    ).where(
      'trial_ends_at < ?', 15.days.from_now
    ).find_each do |organization|
      days_until_trial_ends = (organization.trial_ends_at - Time.current.beginning_of_day).to_i / 1.day

      next unless [2, 7, 14].include? days_until_trial_ends

      payment_methods = NetworkApi::PaymentMethod.find(organization_id: organization.network_organization.id)

      next unless payment_methods.empty?

      TrialEndingSoonMailer.notify(organization, days_until_trial_ends)
    end
  end
end
