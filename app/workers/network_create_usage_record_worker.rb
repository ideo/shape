class NetworkCreateUsageRecordWorker
  include Sidekiq::Worker

  def perform
    Organization.find_each(&:create_network_usage_record)
  end
end
