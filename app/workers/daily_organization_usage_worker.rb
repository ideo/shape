class DailyOrganizationUsageWorker
  include Sidekiq::Worker

  def perform
    Organization.find_in_batches.each do |batch|
      batch.pluck(:id).each do |id|
        NetworkCreateUsageRecordWorker.perform_async(id)
      end
    end
  end
end
