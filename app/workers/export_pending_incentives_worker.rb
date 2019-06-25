class ExportPendingIncentivesWorker
  include Sidekiq::Worker

  def perform
    PaidTests::ExportPendingIncentives.mark_as_paid!
  end
end
