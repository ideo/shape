class OverdueNotificationWorker
  include Sidekiq::Worker

  def perform
    Organization.where(
      in_app_billing: true,
    ).where.not(
      overdue_at: nil,
    ).find_each do |organization|
      days_overdue = (Time.current - organization.overdue_at).to_i / 1.day

      next unless days_overdue == 1 || days_overdue == 7 || days_overdue >= 10

      BillingOverdueMailer.notify(organization).deliver_now
    end
  end
end
