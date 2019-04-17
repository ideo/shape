class OverdueNotificationWorker
  include Sidekiq::Worker

  def perform
    Organization.overdue.find_each do |organization|
      days_overdue = (Time.current - organization.overdue_at).to_i / 1.day

      next unless [1, 7, 14, 21].include? days_overdue

      BillingOverdueMailer.notify(organization).deliver_later
    end
  end
end
