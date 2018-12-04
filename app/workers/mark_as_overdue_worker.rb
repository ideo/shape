class MarkAsOverdueWorker
  include Sidekiq::Worker

  def perform
    Organization.billable.where(
      overdue_at: nil,
      has_payment_method: false,
    ).where(
      '"organizations".active_users_count > "organizations".trial_users_count OR "organizations".trial_ends_at < ?', Time.current
    ).find_each do |organization|
      organization.touch(:overdue_at)
    end
  end
end
