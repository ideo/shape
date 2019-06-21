class ExportPendingIncentivesWorker
  include Sidekiq::Worker

  def perform
    ExportPendingIncentives.mark_as_paid!
  end
end
