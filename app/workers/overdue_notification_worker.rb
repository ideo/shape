class OverdueNotificationWorker
  include Sidekiq::Worker

  def perform
    Organization.overdue.find_each do |organization|
      days_overdue = (Time.current - organization.overdue_at).to_i / 1.day

      next unless days_overdue == 1 || days_overdue == 7 || days_overdue >= 10

      BillingOverdueMailer.notify(organization).deliver_later
    end
  end
end
