class TrialEndingSoonWorker
  include Sidekiq::Worker

  def perform
    Organization.billable.where(
      has_payment_method: false,
    ).where(
      'trial_ends_at < ?', 15.days.from_now
    ).find_each do |organization|
      days_until_trial_ends = (organization.trial_ends_at - Time.current.beginning_of_day).to_i / 1.day

      next unless [2, 7, 14].include? days_until_trial_ends

      next if organization.has_payment_method?

      TrialEndingSoonMailer.notify(organization, days_until_trial_ends).deliver_now
    end
  end
end
